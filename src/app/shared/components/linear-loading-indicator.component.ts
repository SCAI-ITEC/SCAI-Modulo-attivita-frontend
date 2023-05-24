import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { delay } from 'src/app/utils/promise';

@Component({
	selector: 'app-linear-loading-indicator',
	standalone: true,
	imports: [ CommonModule ],
	template: `
        <div class="lli-list">
            <div class="lli-item lli-item--0">S</div>
            <div class="lli-item lli-item--1">C</div>
            <div class="lli-item lli-item--2">A</div>
            <div class="lli-item lli-item--3">I</div>
        </div>
	`,
    styles: [`

        .lli-list {
            position: relative;
            width: 152px;
            height: 32px;
            margin: 0 auto;
        }

        .lli-item {
            position: absolute;
            width: 32px;
            height: 32px;
            display: grid;
            place-items: center;
            background: rgba(var(--app-primary_500), 1);
            box-shadow: 0 0 10px #0002;
            border-radius: 6px;
            color: rgba(var(--app-gray_0), 1);
            font-weight: bold;
            top: 0px;
            left: 0px;
            transition:
                border-radius 300ms ease,
                top 300ms ease,
                left 300ms ease;
        }

        .lli-item.lli-item--active {
            background: rgba(var(--app-primary_200), 1);
            border-radius: 50%;
            top: -40px;
        }
    `]
})
export class LinearLoadingIndicator {

    i = 0;
    stop = false;
	
	ngAfterViewInit() {
        this.loop();
    }

    ngOnDestroy() {
        this.stop = true;
    }

    async loop() {

        if (this.stop) return;

        const positions = [ 0, 40, 80, 120 ];

        const first = document.querySelector(`.lli-item.lli-item--${this.i % 4}`) as any;
        const second = document.querySelector(`.lli-item.lli-item--${(this.i + 1) % 4}`) as any;
        const third = document.querySelector(`.lli-item.lli-item--${(this.i + 2) % 4}`) as any;
        const last = document.querySelector(`.lli-item.lli-item--${(this.i + 3) % 4}`) as any;

        first.style.left = positions[0] + "px";
        second.style.left = positions[1] + "px";
        third.style.left = positions[2] + "px";
        last.style.left = positions[3] + "px";

        await delay(300);

        first.classList.add("lli-item--active");

        await delay(300);
        second.style.left = positions[0] + "px";
        await delay(300);
        third.style.left = positions[1] + "px";
        await delay(300);
        last.style.left = positions[2] + "px";
        first.style.left = positions[3] + "px";
        await delay(300);
        first.classList.remove("lli-item--active");

        this.i++;

        this.loop();
    }
}