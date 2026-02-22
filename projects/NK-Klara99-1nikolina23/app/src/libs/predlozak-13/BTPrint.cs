/*
   *** KORISTI SE ZA CRTANJE ***
   Nemojte ništa pisati ni mijenjati u ovoj datoteci
*/

using System;
using System.Collections.Generic;

namespace crtanje
{
    class NodeInfo
    {
        public Cvor node;
        public string text;
        public int StartPos;
        public int Size { get { return text.Length; } }
        public int EndPos { get { return StartPos + Size; } set { StartPos = value - Size; } }
        public NodeInfo parent, left, right;
    } //NodeInfo

    public static class BTreePrinter
    {
        // this Cvor root - This is an extension method for a class named "Cvor". 
        // The this keyword here means you can call this method directly on any Cvor object
        public static void Print(this Cvor root, string textFormat = "0", int spacing = 1, int topMargin = 2, int leftMargin = 2)
        {
            if (root == null) return;
            int rootTop = Console.CursorTop + topMargin;
            List<NodeInfo> last = new List<NodeInfo>();
            Cvor next = root;
            for (int level = 0; next != null; level++)
            {
                //! --------- dio klase Cvor --------
                NodeInfo drawNode = new NodeInfo { node = next, text = next.BrojID.ToString(textFormat) }; 
                if (level < last.Count)
                {
                    drawNode.StartPos = last[level].EndPos + spacing;
                    last[level] = drawNode;
                }
                else
                {
                    drawNode.StartPos = leftMargin;
                    last.Add(drawNode);
                }
                if (level > 0)
                {
                    drawNode.parent = last[level - 1];
                    //! --------- dio klase Cvor --------
                    if (next == drawNode.parent.node.lijevo) 
                    {
                        drawNode.parent.left = drawNode;
                        drawNode.EndPos = Math.Max(drawNode.EndPos, drawNode.parent.StartPos - 1);
                    }
                    else
                    {
                        drawNode.parent.right = drawNode;
                        drawNode.StartPos = Math.Max(drawNode.StartPos, drawNode.parent.EndPos + 1);
                    }
                }
                //! --------- dio klase Cvor --------
                // The ?? is called the null-coalescing operator in C#. 
                // It returns the left-hand operand if it isn't null, or the right-hand operand if the left one is null.
                next = next.lijevo ?? next.desno; 
                for (; next == null; drawNode = drawNode.parent)
                {
                    int top = rootTop + 2 * level;
                    Print(drawNode.text, top, drawNode.StartPos);
                    if (drawNode.left != null)
                    {
                        Print("/", top + 1, drawNode.left.EndPos);
                        Print("_", top, drawNode.left.EndPos + 1, drawNode.StartPos);
                    }
                    if (drawNode.right != null)
                    {
                        Print("_", top, drawNode.EndPos, drawNode.right.StartPos - 1);
                        Print("\\", top + 1, drawNode.right.StartPos - 1);
                    }
                    if (--level < 0) break;
                    if (drawNode == drawNode.parent.left)
                    {
                        drawNode.parent.StartPos = drawNode.EndPos + 1;
                        //! --------- dio klase Cvor --------
                        next = drawNode.parent.node.desno; 
                    }
                    else
                    {
                        if (drawNode.parent.left == null)
                            drawNode.parent.EndPos = drawNode.StartPos - 1;
                        else
                            drawNode.parent.StartPos += (drawNode.StartPos - 1 - drawNode.parent.EndPos) / 2;
                    }
                }
            }
            Console.SetCursorPosition(0, rootTop + 2 * last.Count - 1);
        }

        private static void Print(string s, int top, int left, int right = -1)
        {
            Console.SetCursorPosition(left, top);
            if (right < 0) right = left + s.Length;
            while (Console.CursorLeft < right) Console.Write(s);
        }
    } // BTreePrinter
}