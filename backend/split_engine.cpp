#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <iomanip>
#include <sstream>

/**
 * RECURSIVE SPLIT FUNCTION (OPTIMIZED)
 * @param data: The content of the file to be split (passed by const reference).
 * @param offset: Starting position in the data.
 * @param length: Length of data to process.
 * @param depth: How many levels to split (e.g., Depth 1 = 3 shards).
 * @param base_path: The directory/name prefix for saving shards.
 * @param shard_id: A reference to a counter to name shards sequentially.
 */
void split_recursive(const std::string& data, size_t offset, size_t length, int depth, const std::string& base_path, int& shard_id) {
    // BASE CASE: If we reached depth 0 or data is too small to split meaningfully
    if (depth == 0 || length < 128) {
        // Zero-pad shard ID for proper lexicographic ordering (e.g., shard_001, shard_002)
        std::ostringstream oss;
        oss << base_path << "_shard_" << std::setfill('0') << std::setw(6) << shard_id++ << ".bin";
        std::string filename = oss.str();
        
        std::ofstream out(filename, std::ios::binary);
        if (out.is_open()) {
            out.write(data.c_str() + offset, length);
            out.close();
            std::cout << "Created: " << filename << " (" << length << " bytes)" << std::endl;
        } else {
            std::cerr << "Error: Could not create shard " << filename << std::endl;
        }
        return;
    }

    // RECURSIVE STEP: Divide current data into 3 parts
    size_t part_len = length / 3;

    for (int i = 0; i < 3; ++i) {
        size_t start = offset + (i * part_len);
        // Ensure the last part takes any remaining bytes from integer division
        size_t sub_length = (i == 2) ? (length - i * part_len) : part_len;
        
        split_recursive(data, start, sub_length, depth - 1, base_path, shard_id);
    }
}

/**
 * MAIN SPLIT FUNCTION
 * @param input_path: Path to the file to split.
 * @param depth: Recursion depth for splitting.
 * @param base_path: Base path for output shards.
 */
bool split_file(const std::string& input_path, int depth, const std::string& base_path) {
    // Read entire file into memory
    std::ifstream file(input_path, std::ios::binary | std::ios::ate);
    if (!file.is_open()) {
        std::cerr << "Error: Could not open input file " << input_path << std::endl;
        return false;
    }
    
    std::streamsize size = file.tellg();
    file.seekg(0, std::ios::beg);
    
    std::string data(size, '\0');
    if (!file.read(&data[0], size)) {
        std::cerr << "Error: Could not read file " << input_path << std::endl;
        return false;
    }
    file.close();
    
    std::cout << "Read " << size << " bytes from " << input_path << std::endl;
    std::cout << "Starting split with depth " << depth << "..." << std::endl;
    
    int shard_id = 0;
    split_recursive(data, 0, data.size(), depth, base_path, shard_id);
    
    std::cout << "Split complete! Created " << shard_id << " shards." << std::endl;
    return true;
}

int main(int argc, char* argv[]) {
    if (argc < 4) {
        std::cout << "Usage: " << argv[0] << " <input_file> <depth> <output_base_path>" << std::endl;
        std::cout << "Example: " << argv[0] << " data.txt 2 output/data" << std::endl;
        return 1;
    }
    
    std::string input_path = argv[1];
    int depth = std::stoi(argv[2]);
    std::string base_path = argv[3];
    
    if (!split_file(input_path, depth, base_path)) {
        return 1;
    }
    
    return 0;
}