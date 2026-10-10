<template>
  <div class="map-skeleton">
    <div class="skeleton-overlay">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
    <div class="skeleton-pulse"></div>
  </div>
</template>

<style scoped>
.map-skeleton {
  position: absolute;
  inset: 0;
  background-color: var(--clr-canvas);
  z-index: 2; /* Sits exactly above the grey Leaflet area */
  overflow: hidden;
}

.skeleton-overlay {
  position: absolute;
  inset: 0;
  color: var(--clr-grey);
  opacity: 0.18;
}

.skeleton-pulse {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--clr-white), transparent 60%),
    transparent
  );
  animation: shimmer 2s infinite linear;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>