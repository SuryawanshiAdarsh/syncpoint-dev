package com.syncpoint.compliance.organization.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "onboarding_completed", nullable = false)
    private boolean onboardingCompleted = false;

    @Column(name = "onboarding_completed_at")
    private Instant onboardingCompletedAt;

    @Column(name = "tsc_scope_extra", nullable = false)
    private String tscScopeExtra = "";

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 16)
    private ReportType reportType = ReportType.TYPE_I;

    @Column(name = "observation_period_start")
    private LocalDate observationPeriodStart;

    @Column(name = "observation_period_end")
    private LocalDate observationPeriodEnd;

    @Column(name = "target_report_date")
    private LocalDate targetReportDate;

    @Column(name = "services_provided", columnDefinition = "text")
    private String servicesProvided;

    @Column(name = "system_boundaries", columnDefinition = "text")
    private String systemBoundaries;

    @Column(name = "components_description", columnDefinition = "text")
    private String componentsDescription;

    @Column(name = "subservice_organizations", columnDefinition = "text")
    private String subserviceOrganizations;

    @Column(name = "complementary_user_entity_controls", columnDefinition = "text")
    private String complementaryUserEntityControls;

    @Column(name = "significant_changes_during_period", columnDefinition = "text")
    private String significantChangesDuringPeriod;

    @Column(name = "auditor_firm_name")
    private String auditorFirmName;

    @Column(name = "auditor_contact_name")
    private String auditorContactName;

    @Column(name = "auditor_contact_email")
    private String auditorContactEmail;

    public Organization() {
    }

    public Organization(UUID id, String name, String slug) {
        this.id = id;
        this.name = name;
        this.slug = slug;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public boolean isOnboardingCompleted() { return onboardingCompleted; }
    public Instant getOnboardingCompletedAt() { return onboardingCompletedAt; }
    public void completeOnboarding() {
        this.onboardingCompleted = true;
        this.onboardingCompletedAt = Instant.now();
    }

    public String getTscScopeExtra() { return tscScopeExtra; }
    public void setTscScopeExtra(String tscScopeExtra) { this.tscScopeExtra = tscScopeExtra == null ? "" : tscScopeExtra; }
    public ReportType getReportType() { return reportType; }
    public void setReportType(ReportType reportType) { this.reportType = reportType; }
    public LocalDate getObservationPeriodStart() { return observationPeriodStart; }
    public void setObservationPeriodStart(LocalDate observationPeriodStart) { this.observationPeriodStart = observationPeriodStart; }
    public LocalDate getObservationPeriodEnd() { return observationPeriodEnd; }
    public void setObservationPeriodEnd(LocalDate observationPeriodEnd) { this.observationPeriodEnd = observationPeriodEnd; }
    public LocalDate getTargetReportDate() { return targetReportDate; }
    public void setTargetReportDate(LocalDate targetReportDate) { this.targetReportDate = targetReportDate; }
    public String getServicesProvided() { return servicesProvided; }
    public void setServicesProvided(String servicesProvided) { this.servicesProvided = servicesProvided; }
    public String getSystemBoundaries() { return systemBoundaries; }
    public void setSystemBoundaries(String systemBoundaries) { this.systemBoundaries = systemBoundaries; }
    public String getComponentsDescription() { return componentsDescription; }
    public void setComponentsDescription(String componentsDescription) { this.componentsDescription = componentsDescription; }
    public String getSubserviceOrganizations() { return subserviceOrganizations; }
    public void setSubserviceOrganizations(String subserviceOrganizations) { this.subserviceOrganizations = subserviceOrganizations; }
    public String getComplementaryUserEntityControls() { return complementaryUserEntityControls; }
    public void setComplementaryUserEntityControls(String complementaryUserEntityControls) { this.complementaryUserEntityControls = complementaryUserEntityControls; }
    public String getSignificantChangesDuringPeriod() { return significantChangesDuringPeriod; }
    public void setSignificantChangesDuringPeriod(String significantChangesDuringPeriod) { this.significantChangesDuringPeriod = significantChangesDuringPeriod; }
    public String getAuditorFirmName() { return auditorFirmName; }
    public void setAuditorFirmName(String auditorFirmName) { this.auditorFirmName = auditorFirmName; }
    public String getAuditorContactName() { return auditorContactName; }
    public void setAuditorContactName(String auditorContactName) { this.auditorContactName = auditorContactName; }
    public String getAuditorContactEmail() { return auditorContactEmail; }
    public void setAuditorContactEmail(String auditorContactEmail) { this.auditorContactEmail = auditorContactEmail; }

    @Override
    public boolean equals(Object o) {
        return o instanceof Organization other && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
