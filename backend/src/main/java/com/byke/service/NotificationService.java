package com.byke.service;

import com.byke.model.entity.Booking;
import com.byke.model.entity.Notification;
import com.byke.model.entity.User;
import com.byke.repository.NotificationRepository;
import com.byke.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Notification createNotification(Long userId, String title, String message, 
                                           String type, Long bookingId) {
        User user = userService.getUserById(userId);
        
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);

        if (bookingId != null) {
            Booking booking = new Booking();
            booking.setId(bookingId);
            notification.setBooking(booking);
        }

        Notification savedNotification = notificationRepository.save(notification);
        
        // 1. Send via WebSocket (In-app)
        messagingTemplate.convertAndSend("/topic/user/" + userId + "/notifications", savedNotification);
        
        // 2. Send via Firebase Cloud Messaging (Push Notification for background/killed state)
        sendPushNotification(user, title, message, type, bookingId);
        
        log.info("Notification created for user {}: {}", userId, title);
        return savedNotification;
    }

    private void sendPushNotification(User user, String title, String message, String type, Long bookingId) {
        try {
            String fcmToken = user.getFcmToken();
            if (fcmToken == null || fcmToken.isBlank()) {
                log.debug("No FCM token for user {}, skipping push notification", user.getId());
                return;
            }
            
            // TODO: Implement actual FCM push using Firebase Admin SDK
            // For now, log that we would send a notification
            log.info("FCM Push Notification for user {}: {} - {} (token: {}...)", 
                user.getId(), title, message, fcmToken.substring(0, Math.min(10, fcmToken.length())));
            
            // In production, you would use Firebase Admin SDK:
            // Message fcmMessage = Message.builder()
            //     .setToken(fcmToken)
            //     .setNotification(Notification.builder()
            //         .setTitle(title)
            //         .setBody(message)
            //         .build())
            //     .putData("type", type)
            //     .putData("bookingId", bookingId != null ? bookingId.toString() : "")
            //     .build();
            // FirebaseMessaging.getInstance().send(fcmMessage);
        } catch (Exception e) {
            log.error("Error sending push notification: ", e);
        }
    }

    public void notifyUser(Long userId, String title, String message) {
        createNotification(userId, title, message, "BOOKING", null);
    }

    public void notifyRider(Long riderId, String title, String message) {
        createNotification(riderId, title, message, "BOOKING", null);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = getUnreadNotifications(userId);
        
        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }
        
        log.info("Marked {} notifications as read for user {}", unreadNotifications.size(), userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
}
