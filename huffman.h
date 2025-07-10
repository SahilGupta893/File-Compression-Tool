// huffman.h
#ifndef HUFFMAN_H
#define HUFFMAN_H

#include <string>
#include <unordered_map>

struct Node {
    char ch;
    int freq;
    Node* left;
    Node* right;

    Node(char c, int f);
};

struct Compare {
    bool operator()(Node* a, Node* b);
};

class Huffman {
public:
    std::unordered_map<char, std::string> codes;
    std::unordered_map<char, int> freqMap;

    Node* buildTree(const std::string& text);
    void generateCodes(Node* root, std::string str);
    std::string encode(const std::string& text);
    std::string decode(Node* root, const std::string& encodedStr);

    
};

void writeCompressed(const std::string& encoded, std::ofstream& out);
std::string readCompressed(std::ifstream& in);
void saveCodes(std::ofstream& out, const std::unordered_map<char, std::string>& codes);
std::unordered_map<char, std::string> loadCodes(std::ifstream& in);

#endif
