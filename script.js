'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const act = String(this.type);
    this.discreption = `${act[0].toUpperCase()}${act.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    //console.log(this.type);
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadance) {
    super(coords, distance, duration);
    this.cadance = cadance;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //minutes per km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGains) {
    super(coords, distance, duration);
    this.elevationGains = elevationGains;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.calcSpeed = this.distance / (this.duration / 60);
    return this.calcSpeed;
  }
}

class App {
  #map;
  #mapp;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    //get data dada
    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._goToPopup.bind(this));
  }

  //

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("Can't access your current location");
      }
    );
  }
  _loadMap(location) {
    this.#map = L.map('map').setView(
      [location.coords.latitude, location.coords.longitude],
      13
    );
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });

    //
  }

  //

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
    console.log(this.#mapEvent);
  }
  _toggleElevationField() {
    if (inputType.value == 'cycling') {
      inputCadence.parentElement.classList.add('form__row--hidden');
      inputElevation.parentElement.classList.remove('form__row--hidden');
    } else {
      if (inputCadence.parentElement.classList.contains('form__row--hidden')) {
        inputCadence.parentElement.classList.remove('form__row--hidden');
        inputElevation.parentElement.classList.add('form__row--hidden');
      }
    }
  }

  //

  _newWorkout(e) {
    e.preventDefault();
    const allPositive = (...input) => input.every(inp => inp > 0);
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers');
      workout = new Running(
        [this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng],
        distance,
        duration,
        cadence
      );
    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !Number.isFinite(distance) ||
        !Number.isFinite(duration) ||
        !Number.isFinite(elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers');
      workout = new Cycling(
        [this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng],
        distance,
        duration,
        elevation
      );
    }
    this.#workouts.push(workout);
    this._setLocalStorage();
    //console.log(this.#workouts);
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    console.log(workout);
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.diaplay = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.diaplay = 'grid'), 1000);
  }
  _renderWorkoutMarker(wk) {
    L.marker(wk.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${wk.type}-popup`,
        })
      )
      .setPopupContent(
        `${wk.type === 'running' ? '🏃🏻' : '🚴🏻‍♂️'} ${wk.discreption}`
      )
      .openPopup();
  }
  //

  _renderWorkout(wk) {
    let html = `
  <li class="workout workout--${wk.type}" data-id="${wk.id}">
  <h2 class="workout__title">${wk.discreption}</h2>
  <div class="workout__details">
    <span class="workout__icon">${wk.type === 'running' ? '🏃🏻' : '🚴🏻‍♂️'}</span>
    <span class="workout__value">${wk.distance}</span>
    <span class="workout__unit">km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⏱</span>
    <span class="workout__value">${wk.duration}</span>
    <span class="workout__unit">min</span>
  </div>
  `;
    if (wk.type === 'running') {
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${wk.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${wk.cadance}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>
    `;
    } else {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${wk.calcSpeed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${wk.elevationGains}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _goToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);
    if (!workoutEl) {
      return;
    }
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);
    this.#map.setView(workout.coords, 10),
      {
        animate: true,
        pan: {
          duration: 1,
        },
      };
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
// L.marker([22.5967, 77.7033])
//   .addTo(map)
//   .bindPopup(
//     L.popup({
//       maxWidth: 250,
//       minWidth: 100,
//       autoClose: false,
//       closeOnClick: false,
//       className: 'running-popup',
//     })
//   )
//   .setPopupContent('hello')
//   .openPopup();
