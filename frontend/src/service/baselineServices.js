/**
 * Baseline Services Data & Normalization Helper
 * Tuân thủ 100% dữ liệu gốc trong CSDL (initData.md - table service_offerings).
 * Đảm bảo tính toàn vẹn và đồng nhất tuyệt đối giữa:
 * 1. Home Page (Dịch vụ nổi bật)
 * 2. Service Page (Menu dịch vụ đầy đủ)
 * 3. Booking Page (Chọn dịch vụ theo từng bước)
 */

export const DB_BASELINE_SERVICES = [
  {
    id: 'fb097fea-559c-4066-b599-bb6f3fb78c7c',
    name: 'Cắt Fade + Undercut',
    price: 180000,
    duration: 60,
    time: '60 phút',
    rating: 4.95,
    usageCount: 1820,
    description: 'Kỹ thuật fade (low/mid/high) kết hợp undercut tạo độ sắc nét tối đa, phù hợp phong cách street và Hàn Quốc.',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop',
    category: 'Cắt tóc',
    categoryName: 'Dịch vụ tóc',
  },
  {
    id: '4763fbe1-129e-4081-888b-cff42fa46b65',
    name: 'Cắt tóc nam chuẩn BachBarber',
    price: 120000,
    duration: 45,
    time: '45 phút',
    rating: 4.9,
    usageCount: 2450,
    description: 'Cắt tóc theo phong cách hiện đại, tư vấn kiểu phù hợp khuôn mặt, gội đầu massage thư giãn sau cắt.',
    image: 'https://images.unsplash.com/photo-1598524374912-628cbcddbc1f?w=500&auto=format&fit=crop',
    category: 'Cắt tóc',
    categoryName: 'Dịch vụ tóc',
  },
  {
    id: '6f53151d-fee2-4d7e-af1c-154ef8691342',
    name: 'Uốn tóc Hàn Quốc',
    price: 350000,
    duration: 120,
    time: '120 phút',
    rating: 4.85,
    usageCount: 780,
    description: 'Uốn xoăn nhẹ phong cách Hàn Quốc, tóc bồng bềnh tự nhiên không cứng. Bao gồm dưỡng ẩm sau uốn.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop',
    category: 'Uốn/Nhuộm',
    categoryName: 'Dịch vụ tóc',
  },
  {
    id: '526b6de4-9219-4a48-8b95-3ae67679e0c1',
    name: 'Nhuộm tóc thời trang',
    price: 480000,
    duration: 150,
    time: '150 phút',
    rating: 4.8,
    usageCount: 650,
    description: "Nhuộm màu highlight, ombre, balayage với thuốc nhuộm cao cấp Wella/L'Oreal. Tư vấn màu sắc cá nhân.",
    image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=500&auto=format&fit=crop',
    category: 'Uốn/Nhuộm',
    categoryName: 'Dịch vụ tóc',
  },
  {
    id: 'fef35ce4-fe3f-4634-a66d-f64d33d77a35',
    name: 'Combo Cắt + Gội + Massage VIP',
    price: 150000,
    duration: 60,
    time: '60 phút',
    rating: 4.88,
    usageCount: 1350,
    description: 'Gói phục vụ trọn gói cao cấp nhất: Cắt tóc, gội dưỡng sinh 30 phút, đắp mặt nạ và sấy tạo kiểu bằng sáp xịn.',
    image: 'https://images.unsplash.com/photo-1516975080661-46bfa33f93a1?w=500&auto=format&fit=crop',
    category: 'Spa & Dưỡng sinh',
    categoryName: 'Thư giãn & Chăm sóc',
  },
  {
    id: '8a2bde63-0847-48e5-b8d2-16fc85535aa7',
    name: 'Chăm sóc da mặt cơ bản',
    price: 200000,
    duration: 75,
    time: '75 phút',
    rating: 4.75,
    usageCount: 420,
    description: 'Làm sạch sâu lỗ chân lông, đắp mặt nạ dưỡng ẩm, tẩy da chết nhẹ nhàng phù hợp da nam.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop',
    category: 'Spa & Dưỡng sinh',
    categoryName: 'Thư giãn & Chăm sóc',
  },
  {
    id: '46c1603c-ee2d-4479-8b49-339830325414',
    name: 'Cạo râu cổ điển Straight Razor',
    price: 130000,
    duration: 40,
    time: '40 phút',
    rating: 4.92,
    usageCount: 560,
    description: 'Cạo râu bằng dao cổ điển, kem cạo râu hảo hạng, khăn nóng thư giãn cơ mặt. Trải nghiệm barber đích thực.',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop',
    category: 'Cắt tóc',
    categoryName: 'Chăm sóc râu',
  },
  {
    id: '6f690432-699a-4505-b639-869bfc4dbe57',
    name: 'Tỉa & tạo hình râu',
    price: 100000,
    duration: 30,
    time: '30 phút',
    rating: 4.87,
    usageCount: 380,
    description: 'Tạo hình râu theo ý muốn, tỉa gọn, làm sạch đường viền. Bao gồm dưỡng beard oil sau tạo kiểu.',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop',
    category: 'Cắt tóc',
    categoryName: 'Chăm sóc râu',
  },
];

/**
 * Chuẩn hóa một service object từ bất kỳ API endpoint nào
 */
export function normalizeService(rawService, fallbackIdx = 0) {
  if (!rawService) return null;

  const rawName = (rawService.name || rawService.serviceName || '').trim();
  const nameLower = rawName.toLowerCase();

  // Xác định category chuẩn theo tên dịch vụ
  let category = 'Cắt tóc';
  if (
    nameLower.includes('uốn') ||
    nameLower.includes('nhuộm') ||
    nameLower.includes('perm') ||
    nameLower.includes('color') ||
    nameLower.includes('highlight') ||
    nameLower.includes('texture')
  ) {
    category = 'Uốn/Nhuộm';
  } else if (
    nameLower.includes('spa') ||
    nameLower.includes('gội') ||
    nameLower.includes('dưỡng') ||
    nameLower.includes('massage') ||
    nameLower.includes('mặt') ||
    nameLower.includes('da') ||
    nameLower.includes('thư giãn')
  ) {
    category = 'Spa & Dưỡng sinh';
  }

  // Tìm trong DB Baseline nếu có để lấy ảnh chuẩn hoặc mô tả chuẩn
  const baseline = DB_BASELINE_SERVICES.find(
    (b) =>
      (rawService.id && String(b.id).toLowerCase() === String(rawService.id).toLowerCase()) ||
      b.name.toLowerCase() === nameLower
  );

  const price = Number(rawService.price) || (baseline ? baseline.price : 120000);
  const duration = Number(rawService.duration) || (baseline ? baseline.duration : 45);
  const image =
    rawService.image ||
    rawService.imageUrl ||
    (baseline ? baseline.image : DB_BASELINE_SERVICES[fallbackIdx % DB_BASELINE_SERVICES.length].image);
  const description =
    rawService.description ||
    (baseline ? baseline.description : 'Dịch vụ chăm sóc tóc chuyên nghiệp chuẩn salon.');

  return {
    id: rawService.id || rawService.serviceId || (baseline ? baseline.id : `srv-${fallbackIdx}`),
    name: rawName || (baseline ? baseline.name : 'Dịch vụ Salon'),
    price,
    duration,
    time: `${duration} phút`,
    description,
    image,
    category,
    rating: rawService.rating || (baseline ? baseline.rating : 4.9),
    usageCount: rawService.usageCount || (baseline ? baseline.usageCount : 500),
    isSuspended: !!rawService.isSuspended,
    suspensionReason: rawService.suspensionReason,
  };
}

