package com.byke.controller;

import com.byke.dto.EarningsSummary;
import com.byke.service.EarningsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rider/earnings")
@RequiredArgsConstructor
public class EarningsController {

    private final EarningsService earningsService;

    @GetMapping("/today")
    public ResponseEntity<?> getTodayEarnings(HttpServletRequest request) {
        try {
            Long riderId = (Long) request.getAttribute("userId"); // Assumes riderId == userId
            EarningsSummary summary = earningsService.getTodayEarnings(riderId);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/week")
    public ResponseEntity<?> getWeeklyEarnings(HttpServletRequest request) {
        try {
            Long riderId = (Long) request.getAttribute("userId");
            EarningsSummary summary = earningsService.getWeeklyEarnings(riderId);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/month")
    public ResponseEntity<?> getMonthlyEarnings(HttpServletRequest request) {
        try {
            Long riderId = (Long) request.getAttribute("userId");
            EarningsSummary summary = earningsService.getMonthlyEarnings(riderId);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getEarningsSummary(HttpServletRequest request) {
        try {
            Long riderId = (Long) request.getAttribute("userId");
            EarningsSummary summary = earningsService.getOverallEarningsSummary(riderId);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(HttpServletRequest request) {
        try {
            Long riderId = (Long) request.getAttribute("userId");
            return ResponseEntity.ok(earningsService.getTransactions(riderId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
