package com.byke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EarningsSummary {
    private Double totalEarnings;
    private Long completedTrips;
    private Double averageFare;
    private Double subscriptionCost;
    private Double netEarnings;
}
