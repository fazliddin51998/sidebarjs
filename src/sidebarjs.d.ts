import { Sidebar, SidebarConfig, HTMLSidebarElement } from './sidebarjs.interface';
export default class SidebarJS implements Sidebar {
    component: HTMLElement;
    container: HTMLElement;
    background: HTMLElement;
    documentMinSwipeX: number;
    documentSwipeRange: number;
    nativeSwipe: boolean;
    nativeSwipeOpen: boolean;
    private initialTouch;
    private touchMoveSidebar;
    private touchMoveDocument;
    constructor({component, container, background, documentMinSwipeX, documentSwipeRange, nativeSwipe, nativeSwipeOpen}?: SidebarConfig);
    toggle(): void;
    open(): void;
    close(): void;
    isVisible(): boolean;
    addAttrsEventsListeners(): void;
    private transcludeContent();
    private addNativeGestures();
    private addNativeOpenGestures();
    private onTouchStart(e);
    private onTouchMove(e);
    private onTouchEnd();
    private moveSidebar(movement);
    private changeBackgroundOpacity(movement);
    private onDocumentTouchStart(e);
    private onDocumentTouchMove(e);
    private onDocumentTouchEnd();
    static create(element: string): HTMLElement;
    static vendorify(el: HTMLElement, prop: string, val: string): HTMLElement;
    static elemHasListener(elem: HTMLSidebarElement, value?: boolean): boolean;
    static readonly version: string;
}
