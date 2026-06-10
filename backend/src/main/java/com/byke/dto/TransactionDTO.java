package com.byke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDTO {
    private String id;
    private String type; // "credit" or "debit"
    private Double amount;
    private String title;
    private String subtitle;
    private String bookingId;
    private LocalDateTime createdAt;
}
