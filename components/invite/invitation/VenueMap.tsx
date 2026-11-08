"use client";
// Mapa real do local (OpenStreetMap), tingido com os azuis do convite.
// O Leaflet só é descarregado quando o mapa se aproxima do ecrã. No telemóvel, um dedo faz scroll à página
// (o mapa não "prende" o scroll); para aproximar usam-se dois dedos ou os botões + e −.
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

const PIN = `<span class="vm-pulse"></span><svg viewBox="0 0 44 58" aria-hidden="true"><path d="M22 57C22 57 3 35 3 21a19 19 0 0 1 38 0c0 14-19 36-19 36z" fill="#1f5fbf" stroke="#ffffff" stroke-width="3"/><circle cx="22" cy="21" r="8" fill="#ffffff"/></svg>`;

export function VenueMap({ lat, lng, name, area }: { lat: number; lng: number; name: string; area: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setInView(true), io.disconnect()), { rootMargin: "300px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !box.current) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !box.current) return;
      const touch = window.matchMedia("(pointer: coarse)").matches;
      map = L.map(box.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: !touch,
        touchZoom: true,
        attributionControl: true,
      });
      L.control.zoom({ position: "topright" }).addTo(map);
      map.attributionControl.setPrefix(false);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        // o OpenStreetMap pede a origem do pedido; só vai o domínio do site, nunca o link pessoal do convite
        referrerPolicy: "strict-origin",
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const icon = L.divIcon({ className: "vm-pin", html: PIN, iconSize: [44, 58], iconAnchor: [22, 57] });
      L.marker([lat, lng], { icon, keyboard: false, interactive: false }).addTo(map);
      // o pino cai depois de o mapa aparecer
      requestAnimationFrame(() => wrap.current?.classList.add("in"));
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [inView, lat, lng]);

  return (
    <div className="vm" ref={wrap}>
      <div className="vm-frame">
        <div className="vm-map" ref={box} role="img" aria-label={`Mapa com a localização de ${name}, ${area}`} />
      </div>
      <p className="vm-tag">
        <small>{area}</small>
        {name}
      </p>
    </div>
  );
}
