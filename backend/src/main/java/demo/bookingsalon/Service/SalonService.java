package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Salon;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.SalonMapper;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Payload.DTO.UserDTO;
import demo.bookingsalon.Repository.SalonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SalonService {
    private final SalonRepository salonRepository;
    private final SalonMapper salonMapper;

    @Transactional
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
                .enabled(true)
                .build();
        return salonRepository.save(salon);
    }

    @Transactional(readOnly = true)
    public List<SalonDTO> getSalons() {
        List<SalonDTO> salons = salonRepository.findAll().stream()
                .map((salon) -> {
                    SalonDTO salonDTO = salonMapper.toSalonDTO(salon);
                    return salonDTO;
                })
        return salonRepository.findAll().stream()
                .map(salonMapper::toSalonDTO)
                .sorted(Comparator.comparing(SalonDTO::getSalonName))
                .toList();
        return salons;
    }

    @Transactional(readOnly = true)
    public SalonDTO getSalonById(UUID salonId) {
        Salon salon = salonRepository.findById(salonId).orElseThrow(() ->
                new NotFoundException("This salon not exist"));
                new NotFoundException("This salon does not exist"));
        return salonMapper.toSalonDTO(salon);
    }

//    public SalonDTO getSalonByOwnerId(String ownerId) {
//        Salon salon = salonRepository.findByOwnerId(UUID.fromString(ownerId));
//        return salonMapper.toSalonDTO(salon);
//    }

    @Transactional(readOnly = true)
    public List<SalonDTO> getSalonByCity(String city) {
        List<SalonDTO> salonDTOs = salonRepository.findByCityContainingOrderBySalonNameAsc(city).stream()
                .map((salon) -> {
                    SalonDTO salonDTO = salonMapper.toSalonDTO(salon);
                    return salonDTO;
                })
        return salonRepository.findByCityContainingOrderBySalonNameAsc(city).stream()
                .map(salonMapper::toSalonDTO)
                .toList();
        return salonDTOs;
    }

    public List<SalonDTO> getSalonByCityAndOpenTime(String city, LocalDateTime openTime) {
        List<SalonDTO> salonDTOs = salonRepository.findByCityAndOpenTime(city, openTime).stream()
                .map((salon) -> {
                    SalonDTO salonDTO = salonMapper.toSalonDTO(salon);
                    return salonDTO;
                })
    @Transactional(readOnly = true)
    public List<SalonDTO> getSalonByCityAndOpenTime(String city, LocalTime openTime) {
        return salonRepository.findByCityAndOpenTime(city, openTime).stream()
                .map(salonMapper::toSalonDTO)
                .toList();
        return salonDTOs;
    }

    @Transactional
    public Salon updateSalon(SalonDTO salonDTO) {
        Salon salon = salonRepository.findById(salonDTO.getId()).orElseThrow(() ->
                new NotFoundException("Salon not exist"));
                new NotFoundException("Salon does not exist"));

        salon.setCity(salonDTO.getCity());
        salon.setEmail(salonDTO.getEmail());
        salon.setAddress(salonDTO.getAddress());
        salon.setImages(salonDTO.getImages());
        salon.setSalonName(salonDTO.getSalonName());
        salon.setCloseTime(salonDTO.getCloseTime());
        salon.setOpenTime(salonDTO.getOpenTime());
        salon.setPhoneNumber(salonDTO.getPhoneNumber());
        salon.setEnabled(salonDTO.isEnabled());

        salonRepository.save(salon);
        return salon;
        return salonRepository.save(salon);
    }

    @Transactional
    public String deleteSalon(UUID salonId) {
         Salon salon = salonRepository.findById(salonId).orElseThrow(() ->
                 new NotFoundException("This salon not exist"));
         salonRepository.delete(salon);
         return "Delete salon successfully";
        Salon salon = salonRepository.findById(salonId).orElseThrow(() ->
                new NotFoundException("This salon does not exist"));
        salonRepository.delete(salon);
        return "Delete salon successfully";
    }
}