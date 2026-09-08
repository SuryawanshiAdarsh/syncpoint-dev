package com.syncpoint.compliance.compliance.controller;

import com.syncpoint.compliance.compliance.service.ReadinessReportService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/readiness-report")
public class ReadinessReportController {

    private final ReadinessReportService service;

    public ReadinessReportController(ReadinessReportService service) {
        this.service = service;
    }

    @GetMapping("/download")
    public ResponseEntity<ByteArrayResource> download() {
        byte[] bytes = service.generate();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/plain;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"soc2-readiness-report.txt\"")
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }
}
