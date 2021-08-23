import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GithubUser {
    id: number;
    login: string;
    html_url: string;
    url: string;
    avatar_url: string;
    score: number;
}

export interface GithubResponse {
    total_count: number;
    items: GithubUser[];
}

export class UserHttpDatabase {
    public constructor(private httpClient: HttpClient) { }

    public getUsers(query: string, page: number): Observable<GithubResponse> {
        return this.httpClient.get<GithubResponse>(`https://api.github.com/search/users?q=${query}&page=${page + 1}`);
    }
}
