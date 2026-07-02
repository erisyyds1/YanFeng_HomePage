package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Authorizer interface {
	Authorize(subject string, object string, action string) bool
}

type AllowAllAuthorizer struct{}

func (AllowAllAuthorizer) Authorize(_ string, _ string, _ string) bool {
	return true
}

type Service struct {
	adminPassword string
	secret        []byte
	ttl           time.Duration
	authorizer    Authorizer
}

type Session struct {
	Token      string `json:"token"`
	ExpiresAt  int64  `json:"expiresAt"`
	Configured bool   `json:"configured"`
}

type Claims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

func NewService(adminPassword string, signingSecret string, ttl time.Duration, authorizer Authorizer) *Service {
	if authorizer == nil {
		authorizer = AllowAllAuthorizer{}
	}
	return &Service{
		adminPassword: adminPassword,
		secret:        []byte(signingSecret),
		ttl:           ttl,
		authorizer:    authorizer,
	}
}

func (s *Service) Login(password string) (Session, error) {
	if password == "" || password != s.adminPassword {
		return Session{}, errors.New("invalid admin password")
	}

	expiresAt := time.Now().Add(s.ttl)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		Role: "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "admin",
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	})
	signed, err := token.SignedString(s.secret)
	if err != nil {
		return Session{}, err
	}

	return Session{
		Token:      signed,
		ExpiresAt:  expiresAt.Unix(),
		Configured: true,
	}, nil
}

func (s *Service) Verify(tokenValue string, object string, action string) (*Claims, error) {
	if tokenValue == "" {
		return nil, errors.New("admin token is required")
	}

	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenValue, claims, func(_ *jwt.Token) (any, error) {
		return s.secret, nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("admin token is required")
	}
	if claims.Role != "admin" {
		return nil, errors.New("admin token is required")
	}
	if !s.authorizer.Authorize(claims.Subject, object, action) {
		return nil, errors.New("admin token is required")
	}
	return claims, nil
}
