import Foundation

// API client for REST endpoints
class APIClient {
    private let baseURL: String
    private let session: URLSession
    
    init(baseURL: String = "http://localhost:8080") {
        self.baseURL = baseURL
        self.session = URLSession.shared
    }
    
    // Search vault for text entries
    func searchVault(
        userID: String,
        query: String?,
        startDate: Date? = nil,
        endDate: Date? = nil,
        limit: Int = 10,
        completion: @escaping (Result<[PortalEntry], Error>) -> Void
    ) {
        guard let url = URL(string: "\(baseURL)/vault/search") else {
            completion(.failure(APIError.invalidURL))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let dateFormatter = ISO8601DateFormatter()
        
        var body: [String: Any] = [
            "user_id": userID,
            "limit": limit
        ]
        
        if let query = query, !query.isEmpty {
            body["query"] = query
        }
        
        if let startDate = startDate {
            body["start_date"] = dateFormatter.string(from: startDate)
        }
        
        if let endDate = endDate {
            body["end_date"] = dateFormatter.string(from: endDate)
        }
        
        guard let jsonData = try? JSONSerialization.data(withJSONObject: body) else {
            completion(.failure(APIError.invalidRequest))
            return
        }
        
        request.httpBody = jsonData
        
        session.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(APIError.noData))
                return
            }
            
            do {
                let searchResponse = try JSONDecoder().decode(SearchResponse.self, from: data)
                completion(.success(searchResponse.results))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    // Get recent entries for a user
    func getEntries(
        userID: String,
        limit: Int = 100,
        completion: @escaping (Result<[PortalEntry], Error>) -> Void
    ) {
        guard var urlComponents = URLComponents(string: "\(baseURL)/entries") else {
            completion(.failure(APIError.invalidURL))
            return
        }
        
        urlComponents.queryItems = [
            URLQueryItem(name: "user_id", value: userID),
            URLQueryItem(name: "limit", value: String(limit))
        ]
        
        guard let url = urlComponents.url else {
            completion(.failure(APIError.invalidURL))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        session.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(APIError.noData))
                return
            }
            
            do {
                let entriesResponse = try JSONDecoder().decode(EntriesResponse.self, from: data)
                completion(.success(entriesResponse.entries))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    // Check server health
    func healthCheck(completion: @escaping (Result<Bool, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/health") else {
            completion(.failure(APIError.invalidURL))
            return
        }
        
        session.dataTask(with: url) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse {
                completion(.success(httpResponse.statusCode == 200))
            } else {
                completion(.failure(APIError.invalidResponse))
            }
        }.resume()
    }
}

// MARK: - Models

struct PortalEntry: Codable, Identifiable {
    let id: Int
    let userID: String
    let textContent: String
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case userID = "user_id"
        case textContent = "text_content"
        case createdAt = "created_at"
    }
}

struct SearchResponse: Codable {
    let results: [PortalEntry]
    let count: Int
    let query: String?
}

struct EntriesResponse: Codable {
    let entries: [PortalEntry]
    let count: Int
}

// MARK: - Errors

enum APIError: LocalizedError {
    case invalidURL
    case invalidRequest
    case noData
    case invalidResponse
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidRequest:
            return "Invalid request"
        case .noData:
            return "No data received"
        case .invalidResponse:
            return "Invalid response"
        }
    }
}
