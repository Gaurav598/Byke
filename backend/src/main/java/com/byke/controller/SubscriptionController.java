package com.byke.controller;

import com.byke.model.entity.Payment;
import com.byke.service.SubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/status")
    public ResponseEntity<?> getStatus(HttpServletRequest request) {
        try {
            Long riderId = (Long) request.getAttribute("userId"); // Assume riderId
            return ResponseEntity.ok(subscriptionService.getSubscriptionStatus(riderId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(HttpServletRequest request) {
        try {
            Long riderId = (Long) request.getAttribute("userId");
            List<Payment> history = subscriptionService.getSubscriptionHistory(riderId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/renew")
    public ResponseEntity<?> renew(HttpServletRequest request) {
        try {
            Long riderId = (Long) request.getAttribute("userId");
            Payment payment = subscriptionService.renewSubscription(riderId);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancel(HttpServletRequest request) {
        try {
            Long riderId = (Long) request.getAttribute("userId");
            Map<String, String> res = subscriptionService.cancelSubscription(riderId);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reactivate")
    public ResponseEntity<?> reactivate(HttpServletRequest request) {
        try {
            Long riderId = (Long) request.getAttribute("userId");
            Map<String, String> res = subscriptionService.reactivateSubscription(riderId);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
