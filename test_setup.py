def greet(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    result = greet("World")
    print(result)
    assert result == "Hello, World!"
    print("✅ Setup verification passed!")
