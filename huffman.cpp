#include "huffman.h"
#include <queue>
#include <fstream>
#include <iostream>
#include <bitset>

Node::Node(char c, int f) {
    ch = c;
    freq = f;
    left = right = nullptr;
}

bool Compare::operator()(Node* a, Node* b) {
    return a->freq > b->freq;
}

Node* Huffman::buildTree(const std::string& text) {
    for (char c : text) freqMap[c]++;
    std::priority_queue<Node*, std::vector<Node*>, Compare> pq;

    for (auto& pair : freqMap) {
        pq.push(new Node(pair.first, pair.second));
    }

    while (pq.size() > 1) {
        Node* left = pq.top(); pq.pop();
        Node* right = pq.top(); pq.pop();

        Node* merged = new Node('\0', left->freq + right->freq);
        merged->left = left;
        merged->right = right;

        pq.push(merged);
    }

    return pq.top();
}

void Huffman::generateCodes(Node* root, std::string str) {
    if (!root) return;
    if (!root->left && !root->right) {
        codes[root->ch] = str;
    }
    generateCodes(root->left, str + "0");
    generateCodes(root->right, str + "1");
}

std::string Huffman::encode(const std::string& text) {
    std::string result;
    for (char c : text) result += codes[c];
    return result;
}

std::string Huffman::decode(Node* root, const std::string& encodedStr) {
    std::string result;
    Node* current = root;
    for (char bit : encodedStr) {
        if (bit == '0') current = current->left;
        else current = current->right;

        if (!current->left && !current->right) {
            result += current->ch;
            current = root;
        }
    }
    return result;
}

// --- Binary helpers ---

void writeCompressed(const std::string& encoded, std::ofstream& out) {
    int count = 0;
    char byte = 0;

    for (char bit : encoded) {
        byte <<= 1;
        if (bit == '1') byte |= 1;
        count++;

        if (count == 8) {
            out.write(&byte, 1);
            count = 0;
            byte = 0;
        }
    }

    if (count > 0) {
        byte <<= (8 - count);
        out.write(&byte, 1);
    }
}

std::string readCompressed(std::ifstream& in) {
    std::string bits = "";
    char byte;

    while (in.read(&byte, 1)) {
        for (int i = 7; i >= 0; i--) {
            bits += ((byte >> i) & 1) ? '1' : '0';
        }
    }

    return bits;
}

void saveCodes(std::ofstream& out, const std::unordered_map<char, std::string>& codes) {
    size_t size = codes.size();
    out.write((char*)&size, sizeof(size));

    for (auto& pair : codes) {
        out.write(&pair.first, 1);

        size_t len = pair.second.size();
        out.write((char*)&len, sizeof(len));
        out.write(pair.second.c_str(), len);
    }
}

std::unordered_map<char, std::string> loadCodes(std::ifstream& in) {
    std::unordered_map<char, std::string> codes;
    size_t size;
    in.read((char*)&size, sizeof(size));

    for (size_t i = 0; i < size; i++) {
        char ch;
        size_t len;
        in.read(&ch, 1);
        in.read((char*)&len, sizeof(len));

        std::string code(len, ' ');
        in.read(&code[0], len);
        codes[ch] = code;
    }

    return codes;
}
