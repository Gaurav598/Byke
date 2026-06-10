package com.byke.controller;

import com.byke.model.entity.SupportTicket;
import com.byke.model.entity.SupportTicketReply;
import com.byke.service.SupportService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    @PostMapping("/create")
    public ResponseEntity<?> createTicket(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        try {
            Long creatorId = (Long) request.getAttribute("userId"); // Assume User or Rider ID
            String role = (String) request.getAttribute("role"); // e.g. "ROLE_USER" or "ROLE_RIDER"
            String creatorType = (role != null && role.contains("RIDER")) ? "RIDER" : "USER";

            Long bookingId = payload.containsKey("bookingId") ? Long.valueOf(payload.get("bookingId").toString()) : null;
            String category = (String) payload.get("category");
            String title = (String) payload.get("title");
            String description = (String) payload.get("description");

            SupportTicket ticket = supportService.createTicket(creatorId, creatorType, bookingId, category, title, description);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<?> getMyTickets(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            String role = (String) request.getAttribute("role");
            
            List<SupportTicket> tickets;
            if (role != null && role.contains("RIDER")) {
                tickets = supportService.getRiderTickets(userId);
            } else {
                tickets = supportService.getUserTickets(userId);
            }
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<?> getTicket(@PathVariable String ticketId) {
        try {
            SupportTicket ticket = supportService.getTicket(ticketId);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{ticketId}/replies")
    public ResponseEntity<?> getTicketReplies(@PathVariable String ticketId) {
        try {
            SupportTicket ticket = supportService.getTicket(ticketId);
            List<SupportTicketReply> replies = supportService.getTicketReplies(ticket.getId());
            return ResponseEntity.ok(replies);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{ticketId}/reply")
    public ResponseEntity<?> replyToTicket(@PathVariable String ticketId, @RequestBody Map<String, String> payload, HttpServletRequest request) {
        try {
            Long senderId = (Long) request.getAttribute("userId");
            String role = (String) request.getAttribute("role");
            String senderType = (role != null && role.contains("ADMIN")) ? "ADMIN" : (role != null && role.contains("RIDER")) ? "RIDER" : "USER";
            
            String message = payload.get("message");
            SupportTicketReply reply = supportService.addReply(ticketId, senderId, senderType, message);
            return ResponseEntity.ok(reply);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{ticketId}/close")
    public ResponseEntity<?> closeTicket(@PathVariable String ticketId, @RequestBody Map<String, String> payload, HttpServletRequest request) {
        try {
            Long adminId = (Long) request.getAttribute("userId"); // Assume only admin closes, or user can close own
            String resolution = payload.get("resolution");
            SupportTicket ticket = supportService.closeTicket(ticketId, adminId, resolution);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Admin endpoints
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllTickets(HttpServletRequest request) {
        try {
            // Add admin role check if not handled by filter
            List<SupportTicket> tickets = supportService.getAllTickets();
            return ResponseEntity.ok(tickets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
