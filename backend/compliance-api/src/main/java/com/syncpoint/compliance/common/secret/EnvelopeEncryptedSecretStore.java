package com.syncpoint.compliance.common.secret;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

/**
 * Envelope-encryption implementation of {@link SecretStore}.
 * <p>
 * Each record uses a fresh 256-bit data-encryption-key wrapped by the master
 * key held in memory. The master key is loaded from
 * {@code SYNCPOINT_SECRET_MASTER_KEY} (base64 of 32 bytes). If absent, a
 * random ephemeral key is generated at startup with a loud warning — dev only.
 */
@Component
public class EnvelopeEncryptedSecretStore implements SecretStore {

    private static final Logger log = LoggerFactory.getLogger(EnvelopeEncryptedSecretStore.class);
    private static final String ALG = "AES";
    private static final String TRANSFORM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_BITS = 128;
    private static final int IV_LEN = 12;
    private static final int DEK_BITS = 256;

    private final SecretRecordRepository repository;
    private final String masterKeyBase64;
    private final SecureRandom random = new SecureRandom();
    private SecretKey masterKey;

    public EnvelopeEncryptedSecretStore(SecretRecordRepository repository,
                                        @Value("${syncpoint.secrets.master-key:}") String masterKeyBase64) {
        this.repository = repository;
        this.masterKeyBase64 = masterKeyBase64;
    }

    @PostConstruct
    void init() {
        if (masterKeyBase64 == null || masterKeyBase64.isBlank()) {
            log.warn("SECRET_STORE_MASTER_KEY not set. Generating an ephemeral in-memory master key. "
                    + "Stored secrets WILL NOT survive application restart. This is DEV-ONLY.");
            byte[] bytes = new byte[32];
            random.nextBytes(bytes);
            this.masterKey = new SecretKeySpec(bytes, ALG);
        } else {
            byte[] bytes = Base64.getDecoder().decode(masterKeyBase64);
            if (bytes.length != 32) {
                throw new IllegalStateException("SECRET_STORE_MASTER_KEY must decode to exactly 32 bytes");
            }
            this.masterKey = new SecretKeySpec(bytes, ALG);
        }
    }

    @Override
    @Transactional
    public UUID write(UUID organizationId, String label, byte[] plaintext) {
        try {
            SecretKey dek = KeyGenerator.getInstance(ALG).generateKey();
            byte[] iv = new byte[IV_LEN];
            random.nextBytes(iv);

            Cipher c = Cipher.getInstance(TRANSFORM);
            c.init(Cipher.ENCRYPT_MODE, dek, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] ciphertext = c.doFinal(plaintext);

            byte[] dekIv = new byte[IV_LEN];
            random.nextBytes(dekIv);
            Cipher wrap = Cipher.getInstance(TRANSFORM);
            wrap.init(Cipher.ENCRYPT_MODE, masterKey, new GCMParameterSpec(GCM_TAG_BITS, dekIv));
            byte[] wrappedDek = wrap.doFinal(dek.getEncoded());

            // prepend the wrap-IV to the wrappedDek so we can recover both at read time
            byte[] wrappedWithIv = new byte[IV_LEN + wrappedDek.length];
            System.arraycopy(dekIv, 0, wrappedWithIv, 0, IV_LEN);
            System.arraycopy(wrappedDek, 0, wrappedWithIv, IV_LEN, wrappedDek.length);

            SecretRecord rec = repository.save(new SecretRecord(
                    organizationId, safeLabel(label), ciphertext, iv, wrappedWithIv));
            return rec.getId();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new SecretStoreException("secret write failed", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] read(UUID reference) {
        SecretRecord rec = repository.findById(reference)
                .orElseThrow(() -> new SecretStoreException("secret not found"));
        try {
            byte[] wrappedWithIv = rec.getWrappedDek();
            byte[] dekIv = new byte[IV_LEN];
            byte[] wrappedDek = new byte[wrappedWithIv.length - IV_LEN];
            System.arraycopy(wrappedWithIv, 0, dekIv, 0, IV_LEN);
            System.arraycopy(wrappedWithIv, IV_LEN, wrappedDek, 0, wrappedDek.length);

            Cipher unwrap = Cipher.getInstance(TRANSFORM);
            unwrap.init(Cipher.DECRYPT_MODE, masterKey, new GCMParameterSpec(GCM_TAG_BITS, dekIv));
            byte[] dekBytes = unwrap.doFinal(wrappedDek);
            SecretKey dek = new SecretKeySpec(dekBytes, ALG);

            Cipher c = Cipher.getInstance(TRANSFORM);
            c.init(Cipher.DECRYPT_MODE, dek, new GCMParameterSpec(GCM_TAG_BITS, rec.getIv()));
            return c.doFinal(rec.getCiphertext());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new SecretStoreException("secret read failed", e);
        }
    }

    @Override
    @Transactional
    public void delete(UUID reference) {
        repository.deleteById(reference);
    }

    private static String safeLabel(String label) {
        if (label == null || label.isBlank()) return "secret";
        return label.length() > 128 ? label.substring(0, 128) : label;
    }
}
