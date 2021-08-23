import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { GithubUser, UserHttpDatabase } from './utils/user';
import { LOCATIONS } from './data/locations';
import { PROGRAMMING_LANGUAGES } from './data/programming-languages';
import { merge, Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
    private filterObservable: Observable<any>;
    private userDatabase: UserHttpDatabase;

    public readonly filter: FormGroup;
    public readonly displayedColumns: string[] = ['avatar', 'login', 'id', 'score'];

    public data: GithubUser[] = [];
    public locations = LOCATIONS;
    public languages = PROGRAMMING_LANGUAGES;

    public resultsLength = 0;
    public isLoading = false;

    @ViewChild(MatPaginator)
    public paginator!: MatPaginator;

    public constructor(
        private formBuilder: FormBuilder,
        private httpClient: HttpClient,
    ) {
        this.filter = this.formBuilder.group({
            username: new FormControl(),
            location: new FormControl(),
            programmingLanguage: new FormControl(),
        });

        this.filterObservable = this.filter.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            tap(() => this.paginator.pageIndex = 0),
        );

        this.userDatabase = new UserHttpDatabase(this.httpClient);
    }

    public ngAfterViewInit(): void {
        merge(this.filterObservable, this.paginator.page)
            .pipe(
                switchMap(() => {
                    this.isLoading = true;

                    const query = this.setQuery();
                    const page = this.paginator.pageIndex;

                    return this.userDatabase.getUsers(query, page).pipe(catchError(() => of(null)));
                }),
                map(data => {
                    this.isLoading = false;

                    if (data === null) {
                        this.resultsLength = 0;

                        return [];
                    }

                    this.resultsLength = data.total_count;

                    return data.items;
                }),
            )
            .subscribe(data => this.data = data);
    }

    private setQuery(): string {
        const queryParams: string[] = [];
        const { username, location, programmingLanguage } = this.filter.value;

        if (username) {
            queryParams.push(username);
        }

        if (location) {
            queryParams.push(`location:${location}`);
        }

        if (programmingLanguage) {
            queryParams.push(`language:${programmingLanguage}`);
        }

        return queryParams.map(q => encodeURIComponent(q)).join('+');
    }
}
