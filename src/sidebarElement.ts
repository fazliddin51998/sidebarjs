import { HTMLSidebarElement, SidebarBase, SidebarConfig, SidebarPosition } from '../index';

const SIDEBARJS: string = 'sidebarjs';
const IS_VISIBLE: string = `${SIDEBARJS}--is-visible`;
const IS_MOVING: string = `${SIDEBARJS}--is-moving`;
const LEFT_POSITION: SidebarPosition = 'left';
const RIGHT_POSITION: SidebarPosition = 'right';
const TRANSITION_DURATION: number = 400;
const POSITIONS: SidebarPosition[] = [LEFT_POSITION, RIGHT_POSITION];

export class SidebarElement implements SidebarBase {
  public component: HTMLElement;
  public container: HTMLElement;
  public backdrop: HTMLElement;
  public documentMinSwipeX: number;
  public documentSwipeRange: number;
  public nativeSwipe: boolean;
  public nativeSwipeOpen: boolean;
  public position: SidebarPosition;
  private initialTouch: number;
  private touchMoveSidebar: number;
  private openMovement: number;
  private backdropOpacity: number;
  private backdropOpacityRatio: number;

  constructor(config: SidebarConfig = {}) {
    const {
      component,
      container,
      backdrop,
      documentMinSwipeX = 10,
      documentSwipeRange = 40,
      nativeSwipe,
      nativeSwipeOpen,
      position = 'left',
      backdropOpacity = 0.3,
    } = config;
    this.component = component || document.querySelector(`[${SIDEBARJS}]`) as HTMLElement;
    this.container = container || SidebarElement.create(`${SIDEBARJS}-container`);
    this.backdrop = backdrop || SidebarElement.create(`${SIDEBARJS}-backdrop`);
    this.documentMinSwipeX = documentMinSwipeX;
    this.documentSwipeRange = documentSwipeRange;
    this.nativeSwipe = nativeSwipe !== false;
    this.nativeSwipeOpen = nativeSwipeOpen !== false;
    this.backdropOpacity = backdropOpacity;
    this.backdropOpacityRatio = 1 / backdropOpacity;

    const hasAllConfigDOMElements = component && container && backdrop;
    if (!hasAllConfigDOMElements) {
      try {
        this.transcludeContent();
      } catch (e) {
        throw new Error('You must define an element with [sidebarjs] attribute');
      }
    }

    if (this.nativeSwipe) {
      this.addNativeGestures();
      if (this.nativeSwipeOpen) {
        this.addNativeOpenGestures();
      }
    }

    this.setPosition(position);
    this.addAttrsEventsListeners(this.component.getAttribute(SIDEBARJS));
    this.backdrop.addEventListener('click', this.close.bind(this), {passive: true});
  }

  public toggle(): void {
    this.isVisible() ? this.close() : this.open();
  }

  public open(): void {
    this.component.classList.add(IS_VISIBLE);
    this.setBackdropOpacity(this.backdropOpacity);
  }

  public close(): void {
    this.component.classList.remove(IS_VISIBLE);
    this.backdrop.removeAttribute('style');
  }

  public isVisible(): boolean {
    return this.component.classList.contains(IS_VISIBLE);
  }

  public setPosition(position: SidebarPosition): void {
    this.component.classList.add(IS_MOVING);
    this.position = POSITIONS.indexOf(position) >= 0 ? position : LEFT_POSITION;
    for (let i = 0; i < POSITIONS.length; i++) {
      this.component.classList.remove(`${SIDEBARJS}--${POSITIONS[i]}`);
    }
    this.component.classList.add(`${SIDEBARJS}--${this.hasRightPosition() ? RIGHT_POSITION : LEFT_POSITION}`);
    setTimeout(() => this.component.classList.remove(IS_MOVING), TRANSITION_DURATION);
  }

  public addAttrsEventsListeners(sidebarName: string): void {
    const actions = ['toggle', 'open', 'close'];
    for (let i = 0; i < actions.length; i++) {
      const elements = document.querySelectorAll(`[${SIDEBARJS}-${actions[i]}="${sidebarName}"]`);
      for (let j = 0; j < elements.length; j++) {
        if (!SidebarElement.elemHasListener(<HTMLElement> elements[j])) {
          elements[j].addEventListener('click', this[actions[i]].bind(this), {passive: true});
          SidebarElement.elemHasListener(<HTMLElement> elements[j], true);
        }
      }
    }
  }

  private hasLeftPosition(): boolean {
    return this.position === LEFT_POSITION;
  }

  private hasRightPosition(): boolean {
    return this.position === RIGHT_POSITION;
  }

  private transcludeContent(): void {
    this.container.innerHTML = this.component.innerHTML;
    this.component.innerHTML = '';
    this.component.appendChild(this.container);
    this.component.appendChild(this.backdrop);
  }

  private addNativeGestures(): void {
    this.component.addEventListener('touchstart', this.onTouchStart.bind(this), {passive: true});
    this.component.addEventListener('touchmove', this.onTouchMove.bind(this), {passive: true});
    this.component.addEventListener('touchend', this.onTouchEnd.bind(this), {passive: true});
  }

  private addNativeOpenGestures(): void {
    document.addEventListener('touchstart', this.onSwipeOpenStart.bind(this), {passive: true});
    document.addEventListener('touchmove', this.onSwipeOpenMove.bind(this), {passive: true});
    document.addEventListener('touchend', this.onSwipeOpenEnd.bind(this), {passive: true});
  }

  private onTouchStart(e: TouchEvent): void {
    this.initialTouch = e.touches[0].pageX;
  }

  private onTouchMove(e: TouchEvent): void {
    const documentSwiped = this.initialTouch - e.touches[0].clientX;
    const sidebarMovement = this.getSidebarPosition(documentSwiped);
    this.touchMoveSidebar = -documentSwiped;
    if (sidebarMovement <= this.container.clientWidth) {
      this.moveSidebar(this.touchMoveSidebar);
    }
  }

  private onTouchEnd(): void {
    this.component.classList.remove(IS_MOVING);
    this.container.removeAttribute('style');
    this.backdrop.removeAttribute('style');
    Math.abs(this.touchMoveSidebar) > (this.container.clientWidth / 3.5) ? this.close() : this.open();
    this.initialTouch = null;
    this.touchMoveSidebar = null;
  }

  private moveSidebar(movement: number): void {
    this.component.classList.add(IS_MOVING);
    SidebarElement.vendorify(this.container, 'transform', `translate(${movement}px, 0)`);
    this.updateBackdropOpacity(movement);
  }

  private updateBackdropOpacity(movement: number): void {
    const swipeProgress = 1 - (Math.abs(movement) / this.container.clientWidth);
    const opacity = swipeProgress / this.backdropOpacityRatio;
    this.setBackdropOpacity(opacity);
  }

  private setBackdropOpacity(opacity: number): void {
    this.backdrop.style.opacity = opacity.toString();
  }

  private onSwipeOpenStart(e: TouchEvent): void {
    if (this.targetElementIsBackdrop(e)) {
      return;
    }
    const {clientWidth} = document.body;
    const touchPositionX = e.touches[0].clientX;
    const documentTouch = this.hasLeftPosition() ? touchPositionX : clientWidth - touchPositionX;
    if (documentTouch < this.documentSwipeRange) {
      this.onTouchStart(e);
    }
  }

  private onSwipeOpenMove(e: TouchEvent): void {
    if (!this.targetElementIsBackdrop(e) && this.initialTouch && !this.isVisible()) {
      const documentSwiped = e.touches[0].clientX - this.initialTouch;
      const sidebarMovement = this.getSidebarPosition(documentSwiped);
      if (sidebarMovement > 0) {
        SidebarElement.vendorify(this.component, 'transform', 'translate(0, 0)');
        SidebarElement.vendorify(this.component, 'transition', 'none');
        this.openMovement = sidebarMovement * (this.hasLeftPosition() ? -1 : 1);
        this.moveSidebar(this.openMovement);
      }
    }
  }

  private onSwipeOpenEnd(): void {
    if (this.openMovement) {
      this.openMovement = null;
      this.component.removeAttribute('style');
      this.onTouchEnd();
    }
  }

  private getSidebarPosition(swiped: number): number {
    return (this.container.clientWidth - (this.hasLeftPosition() ? swiped : -swiped));
  }

  private targetElementIsBackdrop(e: TouchEvent): boolean {
    return (<HTMLElement> e.target).hasAttribute(`${SIDEBARJS}-backdrop`);
  }

  public static create(element: string): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute(element, '');
    return el;
  }

  public static vendorify(el: HTMLElement, prop: string, val: string): HTMLElement {
    const Prop = prop.charAt(0).toUpperCase() + prop.slice(1);
    const prefs = ['Moz', 'Webkit', 'O', 'ms'];
    el.style[prop] = val;
    for (let i = 0; i < prefs.length; i++) {
      el.style[prefs[i] + Prop] = val;
    }
    return el;
  }

  public static elemHasListener(elem: HTMLSidebarElement, value?: boolean): boolean {
    return elem && typeof value === 'boolean' ? elem.sidebarjsListener = value : !!elem.sidebarjsListener;
  }
}
