package com.syncpoint.compliance.ai.client;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class AiClientConfig {

    /** Java 21 default is HTTP/2, which uvicorn silently strips bodies from — force HTTP/1.1. */
    @Bean
    public HttpClient aiHttpClient() {
        return HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }
}
