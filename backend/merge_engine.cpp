#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <algorithm>
#include <dirent.h>
#include <sys/stat.h>

#ifdef _WIN32
#include <windows.h>
#endif

/**
 * AUTO-DISCOVER SHARDS (Windows Compatible)
 * Finds all shard files matching the pattern and sorts them in correct order.
 * @param base_path: The base path used when splitting (e.g., "output/data").
 * @return A sorted vector of shard file paths.
 */
std::vector<std::string> discover_shards(const std::string& base_path) {
    std::vector<std::string> shard_paths;
    
    // Extract directory and filename prefix
    size_t last_slash = base_path.find_last_of("/\\");
    std::string dir = (last_slash != std::string::npos) ? base_path.substr(0, last_slash) : ".";
    std::string prefix = (last_slash != std::string::npos) ? base_path.substr(last_slash + 1) : base_path;
    
#ifdef _WIN32
    // Windows implementation using WIN32 API
    std::string search_pattern = dir + "\\*.*";
    WIN32_FIND_DATAA find_data;
    HANDLE hFind = FindFirstFileA(search_pattern.c_str(), &find_data);
    
    if (hFind != INVALID_HANDLE_VALUE) {
        do {
            if (!(find_data.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY)) {
                std::string filename = find_data.cFileName;
                // Check if filename starts with prefix and ends with .bin
                std::string expected_start = prefix + "_shard_";
                if (filename.find(expected_start) == 0 && 
                    filename.length() >= 4 && 
                    filename.substr(filename.length() - 4) == ".bin") {
                    shard_paths.push_back(dir + "\\" + filename);
                }
            }
        } while (FindNextFileA(hFind, &find_data) != 0);
        FindClose(hFind);
    }
#else
    // POSIX implementation using dirent.h
    DIR* directory = opendir(dir.c_str());
    if (directory) {
        struct dirent* entry;
        while ((entry = readdir(directory)) != nullptr) {
            std::string filename = entry->d_name;
            std::string expected_start = prefix + "_shard_";
            if (filename.find(expected_start) == 0 && 
                filename.length() >= 4 && 
                filename.substr(filename.length() - 4) == ".bin") {
                shard_paths.push_back(dir + "/" + filename);
            }
        }
        closedir(directory);
    }
#endif
    
    // Sort shards lexicographically (thanks to zero-padding, this gives correct order)
    std::sort(shard_paths.begin(), shard_paths.end());
    
    return shard_paths;
}

/**
 * SEQUENTIAL MERGE FUNCTION
 * @param shard_paths: A list of full paths to the .bin shards in correct order.
 * @param output_path: Where to save the reconstructed original file.
 * @return true if successful, false otherwise.
 */
bool merge_shards(const std::vector<std::string>& shard_paths, const std::string& output_path) {
    if (shard_paths.empty()) {
        std::cerr << "Error: No shards provided for merging." << std::endl;
        return false;
    }
    
    std::ofstream final_file(output_path, std::ios::binary);
    
    if (!final_file.is_open()) {
        std::cerr << "Error: Could not create output file at " << output_path << std::endl;
        return false;
    }

    size_t total_bytes = 0;
    int shard_count = 0;
    
    for (const std::string& path : shard_paths) {
        std::ifstream shard(path, std::ios::binary);
        
        if (shard.is_open()) {
            // Get file size
            shard.seekg(0, std::ios::end);
            size_t size = shard.tellg();
            shard.seekg(0, std::ios::beg);
            
            // Efficiently copy the shard buffer into the final file
            final_file << shard.rdbuf();
            shard.close();
            
            total_bytes += size;
            shard_count++;
            std::cout << "Merged: " << path << " (" << size << " bytes)" << std::endl;
        } else {
            std::cerr << "Error: Shard missing or unreadable: " << path << std::endl;
            final_file.close();
            return false;
        }
    }
    
    final_file.close();
    std::cout << "Merge complete! Wrote " << total_bytes << " bytes from " << shard_count << " shards." << std::endl;
    return true;
}

int main(int argc, char* argv[]) {
    if (argc < 3) {
        std::cout << "Usage: " << argv[0] << " <base_path> <output_file>" << std::endl;
        std::cout << "Example: " << argv[0] << " output/data reconstructed.txt" << std::endl;
        return 1;
    }
    
    std::string base_path = argv[1];
    std::string output_path = argv[2];
    
    // Auto-discover shard files
    std::cout << "Discovering shards matching pattern: " << base_path << "_shard_*.bin" << std::endl;
    std::vector<std::string> shards = discover_shards(base_path);
    
    if (shards.empty()) {
        std::cerr << "Error: No shard files found!" << std::endl;
        return 1;
    }
    
    std::cout << "Found " << shards.size() << " shards." << std::endl;
    
    if (!merge_shards(shards, output_path)) {
        return 1;
    }
    
    return 0;
}