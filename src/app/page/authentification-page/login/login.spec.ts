import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Login } from './login';
import { LoginService } from '../services/login-service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

class MockLoginService {
  login(username: string, password: string) {
    return of({ token: 'fake-token' });
  }
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let loginService: LoginService;
  let router: MockRouter;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [Login],
      providers: [
        { provide: LoginService, useClass: MockLoginService },
        { provide: Router, useClass: MockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    loginService = TestBed.inject(LoginService);
    router = TestBed.inject(Router) as any;
  });

  it('must display error message if fields are empty', () => {
    component.username = '';
    component.password = '';
    component.login();

    expect(component.errorMessage()).toBe('Veuillez remplir tous les champs correctement.');
    expect(component.loading()).toBeFalse();
  });

  it('must display success message if login is successful and call login service', fakeAsync(() => {
    const loginSpy = spyOn(loginService, 'login').and.returnValue(of({ token: 'abc123' }));

    component.username = 'testuser';
    component.password = 'testpass';
    component.login();

    expect(component.loading()).toBeTrue();

    tick(0);
    expect(component.successMessage()).toBe('Connexion réussie !');
    expect(component.errorMessage()).toBe('');
    expect(component.loading()).toBeFalse();

    tick(1000);
    expect(router.navigate).toHaveBeenCalledWith(['/titlescreen']);
    expect(loginSpy).toHaveBeenCalledWith('testuser', 'testpass');
  }));

  it("must display error message if login is not successful", () => {
    spyOn(loginService, 'login').and.returnValue(throwError(() => ({ status: 401 })));

    component.username = 'wrong';
    component.password = 'bad';
    component.login();

    expect(component.errorMessage()).toBe("Nom d'utilisateur ou mot de passe incorrect.");
    expect(component.successMessage()).toBe('');
    expect(component.loading()).toBeFalse();
  });

  it("must display error message if login is not successful", () => {
    const consoleSpy = spyOn(console, 'error');
    spyOn(loginService, 'login').and.returnValue(throwError(() => ({ status: 500 })));

    component.username = 'test';
    component.password = 'pass';
    component.login();

    expect(consoleSpy).toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Une erreur est survenue. Veuillez réessayer.');
    expect(component.successMessage()).toBe('');
    expect(component.loading()).toBeFalse();
  });
});
