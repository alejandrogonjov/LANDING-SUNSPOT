<template>
  <nav class="bottom-nav" role="navigation">
    <div class="nav-inner">
      <RouterLink to="/" class="nav-item">
        <icon-mdi-map-outline class="nav-icon" />
        <span>Mapa</span>
      </RouterLink>

      <RouterLink to="/explorar" class="nav-item">
        <icon-mdi-magnify class="nav-icon" />
        <span>Explorar</span>
      </RouterLink>

      <RouterLink to="/cuenta" class="nav-item">
        <div class="nav-icon-wrapper">
          <icon-mdi-account-outline class="nav-icon" />
        </div>
        <span>Tú</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  /* Bar background spans the full app band */
  max-width: var(--max-width);
  height: var(--total-nav-height);
  background-color: var(--clr-white);
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--clr-border);
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 1;
}

/* Nav items stay capped and centered; the bar background takes the rest */
.nav-inner {
  width: 100%;
  max-width: var(--max-width-chrome);
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  padding-top: 10px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--clr-text-muted);
  flex: 1;
  gap: 4px;
  transition: color var(--transition);
}

.nav-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-item span {
  font-size: 10px;
  font-weight: 600;
}

.router-link-active {
  color: var(--clr-primary);
}

/* Desktop: DesktopSidebar carries these destinations (and more). */
@media (min-width: 1024px) {
  .bottom-nav {
    display: none;
  }
}
</style>