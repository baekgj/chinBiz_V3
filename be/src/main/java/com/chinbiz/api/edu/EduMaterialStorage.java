package com.chinbiz.api.edu;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * 교육자료 파일 저장소 (docs/32). 공개 정적경로(/uploads)와 분리된 {app.edu-dir} 폴더에 uuid 이름으로 저장하고,
 * 다운로드는 인증 API 가 원본 파일명(Content-Disposition, UTF-8)으로 스트리밍한다.
 */
@Component
public class EduMaterialStorage {

    @Value("${app.edu-dir:edu-materials}")
    private String eduDir;

    private Path root() throws IOException {
        Path root = Paths.get(eduDir).toAbsolutePath().normalize();
        Files.createDirectories(root);
        return root;
    }

    /** 저장 후 저장파일명(uuid.ext) 반환 */
    public String save(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')).toLowerCase() : "";
        if (!ext.matches("\\.[a-z0-9]{1,8}")) ext = "";
        String name = UUID.randomUUID().toString().replace("-", "") + ext;
        Files.copy(file.getInputStream(), root().resolve(name), StandardCopyOption.REPLACE_EXISTING);
        return name;
    }

    public void delete(String storedName) {
        try { Files.deleteIfExists(root().resolve(storedName).normalize()); } catch (IOException ignore) { }
    }

    /** 첨부 다운로드 응답 (파일 없으면 null) */
    public ResponseEntity<Resource> download(EduMaterial m) throws IOException {
        Path root = root();
        Path p = root.resolve(m.getStoredName()).normalize();
        if (!p.startsWith(root) || !Files.isRegularFile(p)) return null;
        MediaType type;
        try { type = m.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(m.getContentType()); }
        catch (Exception e) { type = MediaType.APPLICATION_OCTET_STREAM; }
        return ResponseEntity.ok()
                .contentType(type)
                .contentLength(Files.size(p))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(m.getOriginalName(), StandardCharsets.UTF_8).build().toString())
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(new FileSystemResource(p));
    }
}
