package com.chinbiz.api.upload;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * 이미지 파일 업로드 (본사 마스터 어드민 전용).
 * 저장: {upload-dir}/<uuid>.<ext>, 반환: 정적 서빙 절대 URL.
 */
@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "파일이 비어 있습니다."));
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')).toLowerCase() : "";
        String name = UUID.randomUUID().toString().replace("-", "") + ext;

        Path root = Paths.get(uploadDir).toAbsolutePath();
        Files.createDirectories(root);
        Files.copy(file.getInputStream(), root.resolve(name), StandardCopyOption.REPLACE_EXISTING);

        // ★ 상대경로로 반환(호스트/프로토콜 비의존). 리버스 프록시(HTTPS)·localhost 모두 동작.
        //   절대 URL(fromCurrentContextPath)은 프록시 뒤에서 http://내부호스트 로 잡혀 https 페이지에서 mixed-content 차단됨.
        String url = "/uploads/" + name;
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("url", url, "name", name));
    }
}
