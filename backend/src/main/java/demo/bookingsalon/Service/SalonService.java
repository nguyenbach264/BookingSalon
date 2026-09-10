package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Salon;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.SalonMapper;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Payload.DTO.UserDTO;
import demo.bookingsalon.Repository.SalonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SalonService {
    private final SalonRepository salonRepository;
    private final SalonMapper salonMapper;

    public Salon createSalon(SalonDTO salonDTO) {
        Salon salon = Salon.builder()
                .salonName(salonDTO.getSalonName())
                .address(salonDTO.getAddress())
                .email(salonDTO.getEmail())
                .images(salonDTO.getImages())
                .closeTime(salonDTO.getCloseTime())
                .openTime(salonDTO.getOpenTime())
                .city(salonDTO.getCity())
                .phoneNumber(salonDTO.getPhoneNumber())
                .build();
        return salonRepository.save(salon);
    }

    public List<SalonDTO> getSalons() {
        List<SalonDTO> salons = salonRepository.findAll().stream()
                .map((salon) -> {
                    SalonDTO salonDTO = salonMapper.toSalonDTO(salon);
                    return salonDTO;
                })
                .sorted(Comparator.comparing(SalonDTO::getSalonName))
                .toList();
        return salons;
    }

    public SalonDTO getSalonById(UUID salonId) {
        Salon salon = salonRepository.findById(salonId).orElseThrow(() ->
                new NotFoundException("This salon not exist"));
        return salonMapper.toSalonDTO(salon);
    }

//    public SalonDTO getSalonByOwnerId(String ownerId) {
//        Salon salon = salonRepository.findByOwnerId(UUID.fromString(ownerId));
//        return salonMapper.toSalonDTO(salon);
//    }

    public List<SalonDTO> getSalonByCity(String city) {
        List<SalonDTO> salonDTOs = salonRepository.findByCityContainingOrderBySalonNameAsc(city).stream()
                .map((salon) -> {
                    SalonDTO salonDTO = salonMapper.toSalonDTO(salon);
                    return salonDTO;
                })
                .toList();
        return salonDTOs;
    }

    public List<SalonDTO> getSalonByCityAndOpenTime(String city, LocalDateTime openTime) {
        List<SalonDTO> salonDTOs = salonRepository.findByCityAndOpenTime(city, openTime).stream()
                .map((salon) -> {
                    SalonDTO salonDTO = salonMapper.toSalonDTO(salon);
                    return salonDTO;
                })
                .toList();
        return salonDTOs;
    }

    public Salon updateSalon(SalonDTO salonDTO) {
        Salon salon = salonRepository.findById(salonDTO.getId()).orElseThrow(() ->
                new NotFoundException("Salon not exist"));

        salon.setCity(salonDTO.getCity());
        salon.setEmail(salonDTO.getEmail());
        salon.setAddress(salonDTO.getAddress());
        salon.setImages(salonDTO.getImages());
        salon.setSalonName(salonDTO.getSalonName());
        salon.setCloseTime(salonDTO.getCloseTime());
        salon.setOpenTime(salonDTO.getOpenTime());
        salon.setPhoneNumber(salonDTO.getPhoneNumber());

        salonRepository.save(salon);
        return salon;
    }

    public String deleteSalon(UUID salonId) {
         Salon salon = salonRepository.findById(salonId).orElseThrow(() ->
                 new NotFoundException("This salon not exist"));
         salonRepository.delete(salon);
         return "Delete salon successfully";
    }
}