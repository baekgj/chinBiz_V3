package com.chinbiz.api.ad;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * 광고 이미지 리사이징 저장 (docs/32) — HOME 폭에 맞춰 PC/모바일 2종 생성(축소만, 확대 없음).
 *  - 슬라이드/배너: PC 1200px(HOME 컨텐츠 폭 1152 기준) · 모바일 750px
 *  - 레이어팝업: PC/모바일 600px
 * PNG(투명) 는 PNG 유지, 그 외는 JPEG(품질 0.86). 저장: {upload-dir}/ads/ → /uploads/ads/.. (공개 정적)
 */
@Component
public class AdImageResizer {

    public static final int PC_WIDTH = 1200;
    public static final int MOBILE_WIDTH = 750;
    public static final int POPUP_WIDTH = 600;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public record Result(String url, String mobileUrl, int width, int height) {}

    public Result save(MultipartFile file, Ad.AdType type) throws IOException {
        BufferedImage src;
        try (InputStream in = file.getInputStream()) { src = ImageIO.read(in); }
        if (src == null) throw new IllegalArgumentException("이미지 파일(JPG·PNG·GIF)만 업로드할 수 있습니다.");

        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        boolean png = original.endsWith(".png") || "image/png".equals(file.getContentType());
        int pcW = type == Ad.AdType.LAYER_POPUP ? POPUP_WIDTH : PC_WIDTH;
        int moW = type == Ad.AdType.LAYER_POPUP ? POPUP_WIDTH : MOBILE_WIDTH;

        Path dir = Paths.get(uploadDir, "ads").toAbsolutePath();
        Files.createDirectories(dir);
        String base = UUID.randomUUID().toString().replace("-", "");
        String ext = png ? ".png" : ".jpg";

        BufferedImage pc = resize(src, pcW, png);
        write(pc, dir.resolve(base + ext), png);
        String mobileUrl = null;
        if (moW < pcW && src.getWidth() > moW) {
            write(resize(src, moW, png), dir.resolve(base + "_m" + ext), png);
            mobileUrl = "/uploads/ads/" + base + "_m" + ext;
        }
        return new Result("/uploads/ads/" + base + ext, mobileUrl, pc.getWidth(), pc.getHeight());
    }

    /** 목표 폭으로 축소(원본이 작으면 그대로). 단계적 절반 축소로 화질 유지 */
    private BufferedImage resize(BufferedImage src, int targetW, boolean alpha) {
        int type = alpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage cur = toType(src, type);
        if (src.getWidth() <= targetW) return cur;
        int w = cur.getWidth();
        while (w > targetW) {
            w = Math.max(targetW, w / 2);
            int h = Math.max(1, Math.round((float) src.getHeight() * w / src.getWidth())); // 비율 유지
            BufferedImage next = new BufferedImage(w, h, type);
            Graphics2D g = next.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.drawImage(cur, 0, 0, w, h, null);
            g.dispose();
            cur = next;
        }
        return cur;
    }

    /** 색공간 통일(JPEG 는 흰 배경으로 알파 제거) */
    private BufferedImage toType(BufferedImage src, int type) {
        if (src.getType() == type) return src;
        BufferedImage out = new BufferedImage(src.getWidth(), src.getHeight(), type);
        Graphics2D g = out.createGraphics();
        if (type == BufferedImage.TYPE_INT_RGB) { g.setColor(Color.WHITE); g.fillRect(0, 0, src.getWidth(), src.getHeight()); }
        g.drawImage(src, 0, 0, null);
        g.dispose();
        return out;
    }

    private void write(BufferedImage img, Path path, boolean png) throws IOException {
        if (png) { ImageIO.write(img, "png", path.toFile()); return; }
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(0.86f);
        try (ImageOutputStream out = ImageIO.createImageOutputStream(path.toFile())) {
            writer.setOutput(out);
            writer.write(null, new IIOImage(img, null, null), param);
        } finally {
            writer.dispose();
        }
    }
}
