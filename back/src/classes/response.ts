export class ApiResponse {
    private status: number
    private data?: object

    constructor(response: { status?: number, data?: object }) {
        this.status = response.status ?? 200
        this.data = response.data
    }

    get statusCode() {
        return this.status
    }

    get body() {
        return this.data
    }
}