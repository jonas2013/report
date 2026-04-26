.PHONY: dev prod down logs seed ps clean

dev:
	docker compose up --build -d
	@echo "开发环境启动成功"
	@echo "  前端：http://localhost"
	@echo "  后端：http://localhost:3001"
	@echo "  数据库：localhost:5432"

prod:
	docker compose -f docker-compose.prod.yml up --build -d
	@echo "生产环境启动成功"

down:
	docker compose down

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

seed:
	docker compose exec backend npx tsx prisma/seed.ts

shell-backend:
	docker compose exec backend sh

shell-db:
	docker compose exec postgres psql -U devuser -d daily_report_dev

ps:
	docker compose ps

backup:
	docker compose exec postgres pg_dump -U devuser daily_report_dev > ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "备份完成"

clean:
	docker compose down -v
	@echo "所有容器和数据卷已删除"
