import { Routes } from '@angular/router';
import { TitleScreenComponent } from './ui/title-screen/title-screen';
import { TitleMenu } from './ui/title-menu/title-menu';
import { ButtonMenu } from './shared/button-menu/button-menu';
import { MapComponent } from './map/components/map/map';
import { MapLayout } from './map/layout/map-layout/map-layout';

export const routes: Routes = [
    { path: '', component: TitleScreenComponent },
    { path: 'titlemenu', component: TitleMenu },
    { path: 'newGame', component: MapLayout },

    { path: 'test', component: ButtonMenu }
];
