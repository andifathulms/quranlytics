"""Celery application for background tasks (stats recomputation, caching)."""
import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("quranlytics")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "recompute-all-stats-nightly": {
        "task": "apps.analytics.tasks.recompute_all_stats",
        "schedule": crontab(hour=3, minute=0),  # 03:00 UTC nightly
    },
}


@app.task(bind=True)
def debug_task(self) -> None:
    print(f"Request: {self.request!r}")
