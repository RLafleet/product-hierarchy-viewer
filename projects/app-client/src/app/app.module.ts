import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FeatureHierarchyModule } from './features/hierarchy/feature-hierarchy.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FeatureHierarchyModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
