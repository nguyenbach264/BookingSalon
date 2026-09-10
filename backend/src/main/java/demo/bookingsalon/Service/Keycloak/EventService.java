package demo.bookingsalon.Service.Keycloak;

import demo.bookingsalon.Payload.Request.Keycloak.FilterEventRequest;
import demo.bookingsalon.Payload.Response.Keycloak.AdminEventResponse;
import demo.bookingsalon.Payload.Response.Keycloak.EventResponse;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.AdminEventRepresentation;
import org.keycloak.representations.idm.AuthDetailsRepresentation;
import org.keycloak.representations.idm.EventRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

@Service
public class EventService {
    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    public EventService(Keycloak keycloak) {
        this.keycloak = keycloak;
    }

    public List<EventResponse> getAllEvents() {
        return keycloak.realm(realm).getEvents().stream().map(
                this::toEventResponse
        ).toList();
    }

    public List<EventResponse> getUserEvents(FilterEventRequest filter) {

        List<EventRepresentation> events = keycloak.realm(realm).getEvents(
                filter.getTypes(),
                filter.getClientId(),
                filter.getUserId(),
                formatDate(filter.getFromDate()),
                formatDate(filter.getToDate()),
                filter.getIpAddress(),
                filter.getFirst(),
                filter.getMax()
        );

        if (events == null) {
            return Collections.emptyList();
        }

        return events.stream().map(this::toEventResponse).toList();
    }

    /**
     * Lấy Admin Events
     */
    public List<AdminEventResponse> getAdminEvents(FilterEventRequest filter) {

        List<AdminEventRepresentation> events = keycloak.realm(realm)
                .getAdminEvents(
                        filter.getTypes(),
                        realm,
                        filter.getClientId(),
                        filter.getUserId(),
                        filter.getIpAddress(),
                        filter.getResourcePath(),
                        formatDate(filter.getFromDate()),
                        formatDate(filter.getToDate()),
                        filter.getFirst(),
                        filter.getMax()
                );

        if (events == null) {
            return Collections.emptyList();
        }

        return events.stream().map(this::toAdminEventResponse).toList();
    }

    /**
     * Xóa User Events
     */
    public void clearUserEvents() {
        keycloak.realm(realm).clearEvents();
    }

    /**
     * Xóa Admin Events
     */
    public void clearAdminEvents() {
        keycloak.realm(realm).clearAdminEvents();
    }

    /**
     * Convert timestamp -> ISO8601
     */
    private String formatDate(Long timestamp) {

        if (timestamp == null) return null;

        return DateTimeFormatter.ISO_OFFSET_DATE_TIME
                .withZone(ZoneOffset.UTC)
                .format(Instant.ofEpochMilli(timestamp));
    }

    /**
     * Mapper User Event
     */
    private EventResponse toEventResponse(EventRepresentation event) {

        EventResponse response = new EventResponse();

        response.setId(event.getId());
        response.setTime(event.getTime());
        response.setType(event.getType());
        response.setRealmId(event.getRealmId());
        response.setClientId(event.getClientId());
        response.setUserId(event.getUserId());
        response.setSessionId(event.getSessionId());
        response.setIpAddress(event.getIpAddress());
        response.setError(event.getError());
        response.setDetails(event.getDetails());

        return response;
    }

    /**
     * Mapper Admin Event
     */
    private AdminEventResponse toAdminEventResponse(AdminEventRepresentation event) {

        AdminEventResponse response = new AdminEventResponse();

        response.setId(event.getId());
        response.setTime(event.getTime());
        response.setOperationType(
                event.getOperationType() == null ? null : event.getOperationType()
        );

        response.setRealmId(event.getRealmId());

        AuthDetailsRepresentation auth = event.getAuthDetails();

        if (auth != null) {

            response.setClientId(auth.getClientId());
            response.setUserId(auth.getUserId());
            response.setIpAddress(auth.getIpAddress());

        }

        response.setResourceType(
                event.getResourceType() == null ? null : event.getResourceType()
        );

        response.setResourcePath(event.getResourcePath());

        response.setError(event.getError());

        response.setRepresentation(event.getRepresentation());

        return response;
    }

}