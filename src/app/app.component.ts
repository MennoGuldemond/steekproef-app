import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  inProgress = false;
  successful = false;
  attempts = 0;
  currentLog: any = {};

  needInput = false;
  inDebounceTime = false;

  numPackets: number;
  numAdresses: number;

  constructor(private db: AngularFirestore) { }

  ngOnInit(): void {
    // Get permission when app starts
    this.getLocationLog().subscribe(x => console.log(x));
  }

  start(): void {
    this.inProgress = true;
    this.needInput = true;

    this.getLocationLog().subscribe(log => {
      log.type = 'start levering';
      this.currentLog[this.attempts] = log;
    });
  }

  home(): void {
    this.getLocationLog().subscribe(log => {
      log.type = 'Pakket afgeleverd';
      this.currentLog[this.attempts] = log;
    });

    this.needInput = true;
  }

  notHome(): void {
    this.debounce();

    this.getLocationLog().subscribe(log => {
      log.type = 'Bewoner niet thuis';
      this.currentLog[this.attempts] = log;
      this.attempts++;
    });
  }

  stop(): void {
    this.getLocationLog().subscribe(log => {
      if (this.successful === true) {
        log.type = 'Alle pakketten afgeleverd';
      } else {
        log.type = 'Niet alle pakketten afgelevert';
      }

      this.currentLog.end = log;
      this.db.collection('logs').add(this.currentLog);

      this.reset();
    });
  }

  reset(): void {
    this.inProgress = false;
    this.attempts = 0;
    this.successful = false;
    this.currentLog = {};
    this.numPackets = 1;
    this.numAdresses = 1;
    this.needInput = false;
  }

  getLocationLog(): Observable<any> {
    return this.getLocation().pipe(map(x => this.locationToLog(x)));
  }

  getLocation(): Observable<Position> {
    return Observable.create((observer: any) => {
      if (window.navigator && window.navigator.geolocation) {
        window.navigator.geolocation.getCurrentPosition(
          (position) => {
            observer.next(position);
            observer.complete();
          },
          (error) => observer.error(error)
        );
      } else {
        observer.error('Unsupported Browser');
      }
    });
  }

  locationToLog(position: Position): any {
    const coords: any = {};
    if (position) {
      coords.accuracy = position.coords.accuracy;
      coords.latitude = position.coords.latitude;
      coords.longitude = position.coords.longitude;
    }

    return {
      timeStamp: new Date(),
      type: '',
      position: coords,
      attempt: this.attempts
    };
  }

  debounce(): void {
    this.inDebounceTime = true;
    setTimeout(() => {
      this.inDebounceTime = false;
    }, 1000);
  }

  formOk(pak: any, adr: any): void {
    if (this.attempts === 0) {
      this.numPackets = pak.value;
      this.numAdresses = adr.value;

      this.currentLog[this.attempts].numPackets = pak.value;
      this.currentLog[this.attempts].numAdresses = adr.value;
      this.attempts = 1;
    } else {
      this.currentLog[this.attempts].numPackets = pak.value;
      this.attempts++;
      this.numPackets -= pak.value;

      if (this.numPackets < 1) {
        this.successful = true;
      }
    }

    pak.value = 1;
    adr.value = 1;
    this.needInput = false;
  }

}
