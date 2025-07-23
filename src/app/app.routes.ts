import { Routes } from '@angular/router';
import { TitleScreenComponent } from './ui/title-screen/title-screen';
import { TitleMenu } from './ui/title-menu/title-menu';
import { ButtonMenu } from './shared/button-menu/button-menu';
import { MapLayout } from './map/layout/map-layout/map-layout';
import { Home } from './ui/home/home';
import { Register } from './ui/register/register';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'register', component: Register },

    { path: 'titlescreen', component: TitleScreenComponent },
    { path: 'titlemenu', component: TitleMenu },
    { path: 'newGame', component: MapLayout },

    { path: 'test', component: ButtonMenu }
];
