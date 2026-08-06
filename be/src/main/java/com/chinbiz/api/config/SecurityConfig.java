package com.chinbiz.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.chinbiz.api.auth.JwtAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * 보안 설정.
 * - JWT 무상태(STATELESS)
 * - /api/auth/** 는 인증 없이 허용 (가입/로그인/중복확인)
 * - CORS: .env CORS_ORIGINS 대응 (host 뒤 :* 와일드카드)
 */
@Configuration
public class SecurityConfig {

    @Value("${app.cors.allowed-origin-patterns}")
    private String allowedOriginPatterns;

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 인증 불필요: 가입/로그인/중복확인
                        .requestMatchers("/api/auth/login", "/api/auth/signup", "/api/auth/check-id",
                                "/api/auth/verify-account", "/api/auth/reset-password").permitAll()
                        .requestMatchers("/error").permitAll()
                        // 홈페이지(비로그인) 공개 상품 노출 — 민감정보 미포함
                        .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                        // 홈 파트너 입점 상담신청 접수 (공개 POST)
                        .requestMatchers(HttpMethod.POST, "/api/public/partner-inquiry").permitAll()
                        // 업로드된 이미지 정적 서빙은 공개 (img 태그가 토큰 못 보냄)
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                        // 웹푸시 VAPID 공개키는 공개(구독 전 클라이언트가 조회), 나머지 push는 인증 필요
                        .requestMatchers(HttpMethod.GET, "/api/push/vapid-public-key").permitAll()
                        .requestMatchers("/api/push/**").authenticated()
                        // 로그인 사용자 본인 정보(내 정보 수정) — user 테이블 역할 공용
                        .requestMatchers("/api/user/**").authenticated()
                        // 파트너사 본인(자기 정보·본인 상품) 전용
                        .requestMatchers("/api/partner/**").hasRole("PARTNER")
                        // 버즈/매니저 워크스페이스(네트워크·마켓·1차영업·교육) 전용
                        .requestMatchers("/api/buzz/**").hasAnyRole("BUZZ", "MANAGER")
                        // 교육관리(신청/승인)는 본사·센터 전용
                        .requestMatchers("/api/education/**").hasAnyRole("MASTER_ADMIN", "CENTER_ADMIN")
                        // 센터 관리(매니저 신청/승인 등)는 센터 전용
                        .requestMatchers("/api/center/**").hasRole("CENTER_ADMIN")
                        // 본부 대시보드 등은 본부 전용
                        .requestMatchers("/api/division/**").hasRole("DIVISION_ADMIN")
                        // 이미지 업로드는 본사·파트너 공통 허용 (상품 이미지 등록)
                        .requestMatchers("/api/uploads", "/api/uploads/**").hasAnyRole("MASTER_ADMIN", "PARTNER")
                        // 공지사항 관리(등록/수정/삭제/대상별 조회)는 본사 마스터 어드민 전용
                        .requestMatchers("/api/notices/**").hasRole("MASTER_ADMIN")
                        // 역할별 내 공지 조회(본부/센터/매니저/버즈)는 인증 사용자 공용
                        .requestMatchers("/api/my/**").authenticated()
                        // 파트너사·카테고리·상품·조직 관리 API는 본사 마스터 어드민 전용
                        .requestMatchers("/api/partners/**", "/api/categories/**", "/api/products/**", "/api/org/**").hasRole("MASTER_ADMIN")
                        // /api/auth/me 등 그 외는 유효한 JWT 필요
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(Arrays.asList(allowedOriginPatterns.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
