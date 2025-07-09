import { Routes } from '@angular/router';
import { TitleScreenComponent } from './ui/title-screen/title-screen';
import { TitleMenu } from './ui/title-menu/title-menu';

export const routes: Routes = [
    { path: '', component: TitleScreenComponent },
    { path: 'titlemenu', component: TitleMenu },
];
