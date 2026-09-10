import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: "http://localhost:8081",
    realm: "booking-salon-realm",
    clientId: "booking-salon-client"
});

export default keycloak;
