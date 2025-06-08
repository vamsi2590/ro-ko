from django.urls import path
from . import views

urlpatterns = [
    path('', views.home),
    path('players/<str:player_name>/', views.get_player),
    path('schedule/', views.schedule),
    path('live/', views.live_matches),
]
