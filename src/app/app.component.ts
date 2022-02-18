import { environment } from './../environments/environment';
import { Component, HostListener, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { AddToHomeScreenService } from './_services/addToHomeScreen.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  isInstall: boolean = false;
  appVersion: string = '';
  iosAgent: boolean = false;
  isAddToHomeScreenEnabled$: BehaviorSubject<boolean>;

  get showInstallBtn(): boolean {
    if (!this.iosAgent && !this.isInstall && this.a2hs.deferredPrompt !=null ) return true;
    return false;
  }

  // event before installing and use it for installing pwa
  @HostListener('window:beforeinstallprompt', ['$event'])
  onEventFire(e: any) {
    e.preventDefault();
    this.a2hs.deferredPrompt = e;
  }

  //#region handling right click
  /**
   * disable right click
   */
  @HostListener('document:contextmenu', ['$event'])
  onEventRightClick(e: any) {
    if (this.isInstall == true) {
      e.preventDefault();
    } else {
      return e;
    }
  }
  //#endregion

  //#region listening to event after install
  /**
   *event after install pwa
   *it just work android and desktop
   */

  @HostListener('window:appinstalled', ['$event'])
  onEventInstallFire() {
    this.isInstall = true;
  }
  //#endregion

  constructor(private sw: SwUpdate, public a2hs: AddToHomeScreenService) {
    this.isAddToHomeScreenEnabled$ = this.a2hs.deferredPromptFired;
  }

  ngOnInit() {
    this.getGeo();
    this.appVersion = environment.appVersion;

    //#region update application
    /**
     * for checking available  update and confirm for updating
     */
    if (this.sw.isEnabled) {
      //('service worker is enable!!');
      this.sw.versionUpdates.subscribe((event) => {
        window.alert('version update');
        if (event) {
          this.sw.activateUpdate().then((p) => {
            location.reload();
          });
        }
      });
    }
    //#endregion

    //#region badge icon
    /**
     *creating badge icon is depend on agent, in android device is red dot in ios nothing
     *use the native badge API
     */
    if ('setAppBadge' in navigator && 'clearAppBadge' in navigator) {
      // in safari and fireFox dose not suppurated
      console.log('setAppBadge is supported ');
      //we can set
      // Set the badge at any time as needed
      const unreadCount = 24;
      (navigator as any)
        .setAppBadge(1000)
        .then((p: any) => {
          console.log('setAppBadge(1000)');
        })
        .catch((error: any) => {
          //Do something with the error.
        });

      // // Clear the badge
      // (navigator as any).clearAppBadge().catch((error: any) => {
      // // Do something with the error.
      // });
    }
    //#endregion
    this.checkPlatform();
    this.isInstall = isInstalled();
  }

  //#region geoLocation
  getGeo() {
    console.log('getGeo')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('position')
        console.log(position)
        //latitude =position.coords.latitude
        // longitude =position.coords.longitude


      },
      (error) => {
        console.log('position')
        console.log(error)

      }
    );
  }
  //#endregion

  installPWA() {
    if (this.showInstallBtn) {
      this.a2hs.showPrompt();
    }else return;
  }
  checkPlatform() {
    if ((navigator as any).standalone == undefined) {
      this.iosAgent = false;
    } else {
      this.iosAgent = true;
    }
  }

}

//#region detect app is installed
const isInstalled = () => {
  // For iOS
  if ((window.navigator as any).standalone) return true;
  else if ((navigator as any).standalone == undefined) {
    console.log('app is not install in ios');
    // For Android
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
  }

  // If neither is true, it's not installed
  return false;
};
//#endregion
