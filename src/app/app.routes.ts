import { Routes } from '@angular/router';
import { TitleScreenComponent } from './page/menu-page/title-screen/title-screen';
import { TitleMenu } from './page/menu-page/title-menu/title-menu';
import { ButtonMenu } from './shared/button-menu/button-menu';
import { Home } from './page/authentification-page/home/home';
import { Register } from './page/authentification-page/register/register';
import { Login } from './page/authentification-page/login/login';
import { MapPage } from './page/map-page/map-page';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'register', component: Register },
    { path: 'login', component: Login },

    { path: 'titlescreen', component: TitleScreenComponent },
    { path: 'titlemenu', component: TitleMenu },
    { path: 'map', component: MapPage },

    { path: 'test', component: ButtonMenu }
];
