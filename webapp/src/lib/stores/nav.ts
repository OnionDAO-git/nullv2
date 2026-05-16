import { writable } from 'svelte/store';

/** Global side-menu open state. Hamburger sets to true; scrim/close button sets to false. */
export const menuOpen = writable(false);

export function openMenu() {
  menuOpen.set(true);
}

export function closeMenu() {
  menuOpen.set(false);
}
