package com.byke.controller;

import com.byke.model.entity.Rider;
import com.byke.service.RiderService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class LocationController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RiderService riderService;

    @MessageMapping("/rider/location")
    public void updateLocation(@Payload LocationUpdateRequest request) {
        // Update rider's location in DB
        try {
            riderService.updateLocation(request.getRiderId(), request.getLatitude(), request.getLongitude());
            
            // Broadcast to the specific booking topic so the user tracking this booking can see it
            if (request.getBookingId() != null) {
                messagingTemplate.convertAndSend("/topic/booking/" + request.getBookingId() + "/location", request);
            }
        } catch (Exception e) {
            log.error("Failed to process location update: ", e);
        }
    }
}

@Data
class LocationUpdateRequest {
    private Long riderId;
    private Long bookingId;
    private Double latitude;
    private Double longitude;
}
