package main

import (
	"fmt"
	"log"

	"go.uber.org/zap"

	"yanfeng-homepage/backend/conf"
	"yanfeng-homepage/backend/dal"
	"yanfeng-homepage/backend/router"
	"yanfeng-homepage/backend/util"
)

func main() {
	cfg, err := conf.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	logger, err := util.NewLogger()
	if err != nil {
		log.Fatalf("init logger: %v", err)
	}
	defer func() {
		_ = logger.Sync()
	}()

	db, err := dal.Open(cfg)
	if err != nil {
		logger.Fatal("open database", zap.Error(err))
	}
	if err := dal.Migrate(db); err != nil {
		logger.Fatal("migrate database", zap.Error(err))
	}
	if err := dal.SeedFromDBJSON(db, cfg.SeedPath); err != nil {
		logger.Fatal("seed database", zap.Error(err))
	}

	engine := router.NewRouter(router.Dependencies{
		Config: cfg,
		DB:     db,
		Logger: logger,
	})

	addr := fmt.Sprintf(":%d", cfg.Port)
	logger.Info("YanFeng Go API server listening", zap.String("addr", addr))
	if err := engine.Run(addr); err != nil {
		logger.Fatal("run server", zap.Error(err))
	}
}
