
import {
    Sun,
    CloudSun,
    Cloud,
    Wind,
    CloudFog,
    CloudRain,
    CloudLightning,
    Snowflake,
} from "lucide-react";

export const WEATHER_CONFIG = [
    { value: 'sunny', icon: Sun, label: 'Soleado', translationKey: 'weather.sunny', color: 'text-yellow-500' },
    { value: 'partly_cloudy', icon: CloudSun, label: 'Parcialmente Nublado', translationKey: 'weather.partly_cloudy', color: 'text-yellow-500' }, // Unified yellow
    { value: 'cloudy', icon: Cloud, label: 'Nublado', translationKey: 'weather.cloudy', color: 'text-gray-500' },
    { value: 'windy', icon: Wind, label: 'Ventoso', translationKey: 'weather.windy', color: 'text-blue-300' },
    { value: 'fog', icon: CloudFog, label: 'Niebla', translationKey: 'weather.fog', color: 'text-gray-400' },
    { value: 'rain', icon: CloudRain, label: 'Lluvia', translationKey: 'weather.rain', color: 'text-blue-500' },
    { value: 'storm', icon: CloudLightning, label: 'Tormenta', translationKey: 'weather.storm', color: 'text-purple-500' },
    { value: 'snow', icon: Snowflake, label: 'Nieve', translationKey: 'weather.snow', color: 'text-cyan-500' },
    { value: 'hail', icon: CloudRain, label: 'Granizo', translationKey: 'weather.hail', color: 'text-blue-700' },
] as const;

export const SEVERITY_OPTIONS = [
    { value: 'low', label: 'Baja (Informativo)', color: 'bg-green-500' },
    { value: 'medium', label: 'Media (Atención)', color: 'bg-yellow-500' },
    { value: 'high', label: 'Alta (Crítico)', color: 'bg-red-500' },
] as const;

