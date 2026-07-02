package main

import (
	"fmt"
	"log"

	"go.uber.org/zap"

	"yanfeng-homepage/backend/internal/config"
	"yanfeng-homepage/backend/internal/database"
	"yanfeng-homepage/backend/internal/httpserver"
	applogger "yanfeng-homepage/backend/internal/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	logger, err := applogger.New()
	if err != nil {
		log.Fatalf("init logger: %v", err)
	}
	defer func() {
		_ = logger.Sync()
	}()

	db, err := database.Open(cfg)
	if err != nil {
		logger.Fatal("open database", zap.Error(err))
	}
	if err := database.Migrate(db); err != nil {
		logger.Fatal("migrate database", zap.Error(err))
	}
	if err := database.SeedFromDBJSON(db, cfg.SeedPath); err != nil {
		logger.Fatal("seed database", zap.Error(err))
	}

	router := httpserver.NewRouter(httpserver.Dependencies{
		Config: cfg,
		DB:     db,
		Logger: logger,
	})

	addr := fmt.Sprintf(":%d", cfg.Port)
	logger.Info("YanFeng Go API server listening", zap.String("addr", addr))
	if err := router.Run(addr); err != nil {
		logger.Fatal("run server", zap.Error(err))
	}
}
