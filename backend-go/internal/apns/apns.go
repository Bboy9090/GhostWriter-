package apns

import (
	"fmt"
	"log"
	"os"

	"github.com/sideshow/apns2"
	"github.com/sideshow/apns2/certificate"
	"github.com/sideshow/apns2/payload"
	"github.com/sideshow/apns2/token"
)

type APNSClient struct {
	client *apns2.Client
	topic  string
}

// NewAPNSClient creates a new APNS client
// Supports both certificate-based and token-based authentication
func NewAPNSClient(authMode, certPath, keyPath, keyID, teamID, topic string, production bool) (*APNSClient, error) {
	var client *apns2.Client

	switch authMode {
	case "certificate":
		cert, err := certificate.FromP12File(certPath, "")
		if err != nil {
			return nil, fmt.Errorf("error loading certificate: %w", err)
		}

		if production {
			client = apns2.NewClient(cert).Production()
		} else {
			client = apns2.NewClient(cert).Development()
		}

	case "token":
		authKey, err := token.AuthKeyFromFile(keyPath)
		if err != nil {
			return nil, fmt.Errorf("error loading auth key: %w", err)
		}

		tokenProvider := &token.Token{
			AuthKey: authKey,
			KeyID:   keyID,
			TeamID:  teamID,
		}

		if production {
			client = apns2.NewTokenClient(tokenProvider).Production()
		} else {
			client = apns2.NewTokenClient(tokenProvider).Development()
		}

	default:
		return nil, fmt.Errorf("invalid auth mode: %s (must be 'certificate' or 'token')", authMode)
	}

	log.Printf("APNS client initialized with %s authentication (production: %v)", authMode, production)

	return &APNSClient{
		client: client,
		topic:  topic,
	}, nil
}

// SendNotification sends a push notification to a device
func (a *APNSClient) SendNotification(deviceToken, title, body string, badge int, customData map[string]interface{}) error {
	notification := &apns2.Notification{
		DeviceToken: deviceToken,
		Topic:       a.topic,
		Payload:     a.buildPayload(title, body, badge, customData),
	}

	res, err := a.client.Push(notification)
	if err != nil {
		return fmt.Errorf("error sending notification: %w", err)
	}

	if res.StatusCode != 200 {
		return fmt.Errorf("APNS error: %s (reason: %s)", res.Reason, res.ApnsID)
	}

	log.Printf("Notification sent successfully to device %s (ApnsID: %s)", deviceToken, res.ApnsID)
	return nil
}

// SendSilentNotification sends a silent push notification
func (a *APNSClient) SendSilentNotification(deviceToken string, customData map[string]interface{}) error {
	p := payload.NewPayload().ContentAvailable()
	
	if customData != nil {
		for key, value := range customData {
			p.Custom(key, value)
		}
	}

	notification := &apns2.Notification{
		DeviceToken: deviceToken,
		Topic:       a.topic,
		Payload:     p,
		Priority:    apns2.PriorityLow,
	}

	res, err := a.client.Push(notification)
	if err != nil {
		return fmt.Errorf("error sending silent notification: %w", err)
	}

	if res.StatusCode != 200 {
		return fmt.Errorf("APNS error: %s (reason: %s)", res.Reason, res.ApnsID)
	}

	return nil
}

// buildPayload creates an APNS payload
func (a *APNSClient) buildPayload(title, body string, badge int, customData map[string]interface{}) *payload.Payload {
	p := payload.NewPayload().
		Alert(title).
		AlertBody(body).
		Badge(badge).
		Sound("default")

	if customData != nil {
		for key, value := range customData {
			p.Custom(key, value)
		}
	}

	return p
}

// Close closes the APNS client (no-op, included for consistency)
func (a *APNSClient) Close() error {
	// The apns2 client doesn't require explicit closing
	return nil
}

// Helper function to check if APNS is configured
func IsAPNSConfigured() bool {
	authMode := os.Getenv("APNS_AUTH_MODE")
	return authMode == "certificate" || authMode == "token"
}
